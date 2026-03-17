import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Request, RequestStatus, RequestPriority } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface UseRequestsResult {
  requests: Request[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  createRequest: (data: CreateRequestData) => Promise<void>;
}

export interface CreateRequestData {
  priority: RequestPriority;
  severity: number;
  symptom: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  allergies?: string[];
  vitals?: Record<string, unknown>;
  notes?: string;
}

export function useRequests(): UseRequestsResult {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user || !profile) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('requests').select('*');

      if (profile.role === 'hospital_staff' && profile.hospital_id) {
        query = query.eq('hospital_id', profile.hospital_id);
      } else if (profile.role === 'paramedic') {
        query = query.eq('paramedic_id', user.id);
      }

      const { data, error: fetchError } = await query.order('requested_at', { ascending: false });

      if (fetchError) {
        console.warn('[requests] fetch failed:', fetchError.message);
        setError(fetchError.message);
        setRequests([]);
      } else {
        setRequests((data ?? []) as Request[]);
      }
    } catch (err) {
      console.error('[requests] unexpected error:', err);
      setError('요청 데이터를 불러오는 중 오류가 발생했습니다.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!user || !profile) return;

    const filterColumn = profile.role === 'hospital_staff' ? 'hospital_id' : 'paramedic_id';
    const filterValue = profile.role === 'hospital_staff' ? profile.hospital_id : user.id;
    if (!filterValue) return;

    const channel = supabase
      .channel(`requests:${filterColumn}:${filterValue}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'requests',
        filter: `${filterColumn}=eq.${filterValue}`,
      }, (payload) => {
        const newReq = payload.new as Request;
        setRequests(prev => [newReq, ...prev]);
        if (profile.role === 'hospital_staff') {
          toast.info('새로운 환자 이송 요청이 도착했습니다!');
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'requests',
        filter: `${filterColumn}=eq.${filterValue}`,
      }, (payload) => {
        const updated = payload.new as Request;
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, profile]);

  const updateRequestStatus = useCallback(async (requestId: string, status: RequestStatus) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status, ...(status === 'matched' ? { matched_at: new Date().toISOString() } : {}) } : r
    ));

    const updateData: Partial<Request> = { status };
    if (status === 'matched') updateData.matched_at = new Date().toISOString();
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      toast.error(`요청 상태 변경 실패: ${error.message}`);
      await fetchRequests();
    }
  }, [fetchRequests]);

  const createRequest = useCallback(async (data: CreateRequestData) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const { error } = await supabase.from('requests').insert({
      paramedic_id: user.id,
      ...data,
    });

    if (error) {
      toast.error(`요청 전송 실패: ${error.message}`);
      throw error;
    }

    toast.success('요청이 병원으로 전송되었습니다!');
    await fetchRequests();
  }, [user, fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests, updateRequestStatus, createRequest };
}
