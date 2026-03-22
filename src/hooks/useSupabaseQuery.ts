import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UseSupabaseQueryOptions<T> {
  table: string;
  fallback: T[];
  enabled?: boolean;
  /** Enable Supabase Realtime subscriptions */
  realtime?: boolean;
  /** Override hospital_id filter (default: from auth profile) */
  hospitalId?: string | null;
  /** Supabase PostgREST select columns (default: '*') */
  columns?: string;
}

interface UseSupabaseQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Generic hook for fetching hospital-scoped data from Supabase.
 * Supports Realtime subscriptions for live updates.
 * Falls back to provided mock data if no hospital_id or on error.
 */
export function useSupabaseQuery<T extends { id: string }>({
  table,
  fallback,
  enabled = true,
  realtime = false,
  hospitalId: overrideHospitalId,
  columns = '*',
}: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const { profile } = useAuth();
  const hospitalId = overrideHospitalId ?? profile?.hospital_id;

  const fallbackRef = useRef<T[]>(fallback);
  useEffect(() => { fallbackRef.current = fallback; });

  const [data, setData] = useState<T[]>(() => fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !hospitalId) {
      setData(fallbackRef.current);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (!supabase) {
      setData(fallbackRef.current);
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error: fetchError } = await supabase
        .from(table)
        .select(columns)
        .eq('hospital_id', hospitalId);

      if (fetchError) {
        console.warn(`[${table}] fetch failed:`, fetchError.message);
        setError(fetchError.message);
        setData(fallbackRef.current);
      } else {
        setData((rows ?? []) as unknown as T[]);
      }
    } catch (err) {
      console.error(`[${table}] unexpected error:`, err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setData(fallbackRef.current);
    } finally {
      setLoading(false);
    }
  }, [table, hospitalId, enabled, columns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!realtime || !enabled || !hospitalId || !supabase) return;

    const channel = supabase
      .channel(`${table}:hospital:${hospitalId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `hospital_id=eq.${hospitalId}`,
        },
        (payload) => {
          const newRow = payload.new as T;
          setData(prev => [...prev, newRow]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `hospital_id=eq.${hospitalId}`,
        },
        (payload) => {
          const updated = payload.new as T;
          setData(prev => prev.map(item => item.id === updated.id ? updated : item));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter: `hospital_id=eq.${hospitalId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          setData(prev => prev.filter(item => item.id !== deleted.id));
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setError(null);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[${table}] realtime ${status}:`, err?.message);
          setError(`실시간 연결 오류 (${status})`);
          toast.error(`[${table}] 실시간 연결이 끊어졌습니다. 30초 후 재연결합니다.`);
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            fetchData();
          }, 30_000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, hospitalId, realtime, enabled, fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
