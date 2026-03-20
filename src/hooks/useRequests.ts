import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Request, RequestStatus, RequestPriority } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errorMessages';
import { withRetry } from '@/utils/retry';
import { useNotification } from './useNotification';
import { enqueue, getQueue, dequeue } from '@/utils/offlineQueue';
import { generateDemoRequests } from '@/utils/demoData';

interface UseRequestsResult {
  requests: Request[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  pendingQueueCount: number;
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(() => getQueue().length);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const flushingRef = useRef(false);
  const demoInitRef = useRef(false);
  const { notify } = useNotification();

  const fetchRequests = useCallback(async () => {
    if (!user || !profile) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // 데모 모드: Supabase 없이 초기 mock 데이터 로드
    if (!supabase) {
      if (!demoInitRef.current) {
        demoInitRef.current = true;
        setRequests(generateDemoRequests());
      }
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

  // 오프라인 큐 플러시 (네트워크 복구 시 자동 재전송)
  const flushQueue = useCallback(async () => {
    if (!user || !supabase || flushingRef.current) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    flushingRef.current = true;
    let sent = 0;

    for (const item of queue) {
      if (item.userId !== user.id) continue;
      try {
        const { error: insertError } = await supabase.from('requests').insert({
          paramedic_id: user.id,
          ...item.data,
        });
        if (!insertError) {
          dequeue(item.id);
          sent++;
        }
      } catch {
        break; // 네트워크 다시 끊긴 경우
      }
    }

    setPendingQueueCount(getQueue().length);
    flushingRef.current = false;

    if (sent > 0) {
      toast.success(`오프라인 대기 요청 ${sent}건이 전송되었습니다`);
      await fetchRequests();
    }
  }, [user, fetchRequests]);

  // 온라인/오프라인 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('네트워크 연결이 복구되었습니다');
      flushQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('네트워크 연결이 끊겼습니다. 요청은 로컬에 저장됩니다.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  // 마운트 시 큐 플러시 시도
  useEffect(() => {
    if (isOnline) flushQueue();
  }, [isOnline, flushQueue]);

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
  }, [user, profile, notify]);

  const updateRequestStatus = useCallback(async (requestId: string, status: RequestStatus) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? { ...r, status, ...(status === 'matched' ? { matched_at: new Date().toISOString() } : {}) } : r
    ));

    if (!supabase) return;

    const updateData: Partial<Request> = { status };
    if (status === 'matched') updateData.matched_at = new Date().toISOString();
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { error } = await withRetry(async () =>
      await supabase
        .from('requests')
        .update(updateData)
        .eq('id', requestId)
    );

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
      // 데모 모드: 로컬 state에 요청 추가 + 가짜 매칭
      const demoId = crypto.randomUUID();
      const hospitals = ['서울대학교병원', '연세세브란스병원', '삼성서울병원', '아산병원'];
      const hospitalName = hospitals[Math.floor(Math.random() * hospitals.length)];
      const distanceKm = Math.round((Math.random() * 8 + 1) * 10) / 10;

      const demoRequest: Request = {
        id: demoId,
        hospital_id: 'demo-hospital',
        paramedic_id: user.id,
        status: 'matched',
        priority: data.priority,
        severity: data.severity,
        symptom: data.symptom,
        patient_name: data.patient_name ?? null,
        patient_age: data.patient_age ?? null,
        patient_gender: data.patient_gender ?? null,
        allergies: data.allergies ?? [],
        vitals: (data.vitals ?? {}) as Request['vitals'],
        distance_km: distanceKm,
        eta_minutes: Math.max(5, Math.round(distanceKm * 3)),
        location_text: data.location_text ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        notes: data.notes ?? null,
        requested_at: new Date().toISOString(),
        matched_at: new Date().toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setRequests(prev => [demoRequest, ...prev]);
      toast.success(`${hospitalName}에 매칭되었습니다! (${distanceKm}km)`);
      return;
    }

    // 오프라인이면 로컬 큐에 저장
    if (!navigator.onLine) {
      enqueue(data, user.id);
      setPendingQueueCount(getQueue().length);
      toast.info('오프라인 상태입니다. 요청이 로컬에 저장되었습니다. 네트워크 복구 시 자동 전송됩니다.');
      return;
    }

    const { data: inserted, error } = await withRetry(async () =>
      await supabase.from('requests').insert({
        paramedic_id: user.id,
        ...data,
      }).select('id').single()
    );

    if (error) {
      // 네트워크 오류면 큐에 저장
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed')) {
        enqueue(data, user.id);
        setPendingQueueCount(getQueue().length);
        toast.info('네트워크 오류로 요청이 로컬에 저장되었습니다. 복구 시 자동 전송됩니다.');
        return;
      }
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

    // 1. Clear current hospital assignment
    const { error } = await supabase
      .from('requests')
      .update({ status: 'pending' as RequestStatus, hospital_id: null, matched_at: null, distance_km: null, eta_minutes: null })
      .eq('id', requestId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      await fetchRequests();
      return;
    }

    // 2. Auto re-match to the next best hospital
    try {
      const { data: matchResult } = await supabase.rpc('match_hospital_for_request', {
        p_request_id: requestId,
      });
      if (matchResult?.matched) {
        toast.success(`${matchResult.hospital_name}에 재배정되었습니다! (${matchResult.distance_km}km)`);
      } else {
        toast.warning('수용 가능한 병원이 없습니다');
      }
    } catch {
      // RPC not configured (demo mode etc.) — silently skip
      toast.info('요청이 거절되었습니다. 다른 병원을 찾고 있습니다.');
    }

    await fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, isOnline, pendingQueueCount, refetch: fetchRequests, updateRequestStatus, createRequest, rejectRequest };
}
