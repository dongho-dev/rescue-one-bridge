import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UseHospitalAcceptingReturn {
  accepting: boolean;
  loading: boolean;
  setAccepting: (value: boolean) => Promise<boolean>;
}

/**
 * Hook to query and update the `accepting` column of the current user's hospital.
 * Subscribes to Realtime so the switch stays in sync across tabs/users.
 * Skips entirely when profile.hospital_id is null.
 */
export function useHospitalAccepting(): UseHospitalAcceptingReturn {
  const { profile } = useAuth();
  const hospitalId = profile?.hospital_id ?? null;

  const [accepting, setAcceptingState] = useState(true);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial value
  useEffect(() => {
    if (!hospitalId || !supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('accepting')
          .eq('id', hospitalId)
          .single();

        if (error) {
          console.warn('[accepting] fetch failed:', error.message);
        } else if (data) {
          setAcceptingState(data.accepting);
        }
      } catch (err) {
        console.error('[accepting] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [hospitalId]);

  // Realtime subscription
  useEffect(() => {
    if (!hospitalId || !supabase) return;

    const channel = supabase
      .channel(`hospitals:accepting:${hospitalId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'hospitals',
        filter: `id=eq.${hospitalId}`,
      }, (payload) => {
        const updated = payload.new as { accepting: boolean };
        setAcceptingState(updated.accepting);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [hospitalId]);

  // Update accepting in DB
  const setAccepting = useCallback(async (value: boolean): Promise<boolean> => {
    if (!hospitalId || !supabase) {
      setAcceptingState(value);
      return true;
    }

    const prev = accepting;
    setAcceptingState(value);

    const { error } = await supabase
      .from('hospitals')
      .update({ accepting: value })
      .eq('id', hospitalId);

    if (error) {
      toast.error('수용 상태 업데이트에 실패했습니다');
      setAcceptingState(prev);
      return false;
    }

    return true;
  }, [hospitalId, accepting]);

  return { accepting, loading, setAccepting };
}
