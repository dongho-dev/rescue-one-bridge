import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Request, RequestStatus, RequestPriority } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errorMessages';
import { useNotification } from './useNotification';

interface UseRequestsResult {
  requests: Request[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  createRequest: (data: CreateRequestData) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
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
  location_text?: string;
  latitude?: number;
  longitude?: number;
}

export function useRequests(): UseRequestsResult {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { notify } = useNotification();

  const fetchRequests = useCallback(async () => {
    if (!user || !profile || !supabase) {
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
    if (!user || !profile || !supabase) return;

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
          notify('새 환자 이송 요청', {
            body: `${newReq.patient_name || '환자'} · ${newReq.symptom} · 중증도 ${newReq.severity}/5`,
            tag: `request-${newReq.id}`,
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'requests',
        filter: `${filterColumn}=eq.${filterValue}`,
      }, (payload) => {
        const updated = payload.new as Request;
        setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
        if (profile.role === 'paramedic' && updated.status === 'matched') {
          notify('병원 배정 완료', {
            body: `${updated.distance_km ?? '?'}km · 예상 ${updated.eta_minutes ?? '?'}분`,
            tag: `matched-${updated.id}`,
          });
        }
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

    if (!supabase) return;

    const updateData: Partial<Request> = { status };
    if (status === 'matched') updateData.matched_at = new Date().toISOString();
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      await fetchRequests();
    }
  }, [fetchRequests]);

  const createRequest = useCallback(async (data: CreateRequestData) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    // Client-side validation
    if (data.patient_age != null && (data.patient_age < 0 || data.patient_age > 150)) {
      toast.error('나이는 0~150 사이의 숫자여야 합니다.');
      return;
    }
    if (data.severity < 1 || data.severity > 5) {
      toast.error('중증도는 1~5 사이의 값이어야 합니다.');
      return;
    }
    if (data.patient_name && data.patient_name.trim().length > 100) {
      toast.error('환자 이름은 100자 이내여야 합니다.');
      return;
    }

    if (!supabase) {
      toast.success('데모 모드: 요청이 전송되었습니다!');
      return;
    }

    const { data: inserted, error } = await supabase.from('requests').insert({
      paramedic_id: user.id,
      ...data,
    }).select('id').single();

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      throw error;
    }

    // 자동 매칭 시도
    if (inserted?.id) {
      try {
        const { data: matchResult } = await supabase.rpc('match_hospital_for_request', {
          p_request_id: inserted.id,
        });
        if (matchResult?.matched) {
          toast.success(`${matchResult.hospital_name}에 매칭되었습니다! (${matchResult.distance_km}km)`);
        } else {
          toast.info('요청이 전송되었습니다. 수용 가능한 병원을 찾고 있습니다.');
        }
      } catch {
        // RPC 미구성(데모 등) 시 조용히 넘어감
        toast.success('요청이 병원으로 전송되었습니다!');
      }
    } else {
      toast.success('요청이 병원으로 전송되었습니다!');
    }

    await fetchRequests();
  }, [user, fetchRequests]);

  const rejectRequest = useCallback(async (requestId: string) => {
    // Optimistic update: remove from current hospital's list
    setRequests(prev => prev.filter(r => r.id !== requestId));

    if (!supabase) return;

    const { error } = await supabase
      .from('requests')
      .update({ status: 'pending' as RequestStatus, hospital_id: null, matched_at: null, distance_km: null, eta_minutes: null })
      .eq('id', requestId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      await fetchRequests();
    }
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests, updateRequestStatus, createRequest, rejectRequest };
}
