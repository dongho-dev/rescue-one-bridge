import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateMockRequests, type MockRequest } from '../components/common/models';

interface CreateRequestData {
  symptom: string;
  severity: number;
  priority: 'emergency' | 'urgent' | 'normal';
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  vitals?: Record<string, unknown>;
  locationText?: string;
  notes?: string;
}

interface UseRequestsReturn {
  requests: MockRequest[];
  loading: boolean;
  error: string | null;
  updateRequestStatus: (requestId: string, status: MockRequest['status']) => void;
  createRequest: (data: CreateRequestData) => Promise<boolean>;
}

export function useRequests(): UseRequestsReturn {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<MockRequest[]>(() => generateMockRequests());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !user) return;

    let cancelled = false;

    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = supabase!.from('requests').select('*');

        if (profile?.role === 'hospital_staff' && profile.hospital_id) {
          query = query.eq('hospital_id', profile.hospital_id);
        } else if (profile?.role === 'paramedic') {
          query = query.eq('paramedic_id', user.id);
        }

        const { data, error: fetchError } = await query.order('requested_at', { ascending: false });
        if (fetchError) throw fetchError;
        if (cancelled) return;

        const mapped: MockRequest[] = (data ?? []).map((r: Record<string, unknown>) => ({
          id: `RQ-${(r.id as string).slice(0, 4).toUpperCase()}`,
          time: new Date(r.requested_at as string),
          severity: r.severity as number,
          distanceKm: Number(r.distance_km ?? 0),
          symptom: r.symptom as string,
          status: dbStatusToFrontend(r.status as string),
          patientAge: r.patient_age ? `${r.patient_age}세` : undefined,
          allergies: (r.allergies as string[] | null)?.length ? (r.allergies as string[]) : undefined,
          eta: r.eta_minutes as number | undefined,
          _supabaseId: r.id as string,
        }));

        setRequests(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch requests');
          setRequests(generateMockRequests());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRequests();

    const channel = supabase!
      .channel('requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user, profile?.hospital_id, profile?.role]);

  const updateRequestStatus = useCallback(
    (requestId: string, status: MockRequest['status']) => {
      const prevRequests = requests;
      setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status } : r)));

      if (supabase) {
        const item = requests.find(r => r.id === requestId);
        const supabaseId = (item as Record<string, unknown> | undefined)?._supabaseId as string | undefined;
        if (supabaseId) {
          const dbStatus = status === 'enRoute' ? 'en_route' : status;
          supabase
            .from('requests')
            .update({ status: dbStatus, ...(status === 'matched' ? { matched_at: new Date().toISOString() } : {}) })
            .eq('id', supabaseId)
            .then(({ error: err }) => {
              if (err) {
                console.error('Request status update failed:', err);
                setRequests(prevRequests);
              }
            });
        }
      }
    },
    [requests],
  );

  const createRequest = useCallback(
    async (data: CreateRequestData): Promise<boolean> => {
      if (!supabase || !user) return true; // Demo mode: always succeeds

      try {
        const { error: insertError } = await supabase.from('requests').insert({
          paramedic_id: user.id,
          symptom: data.symptom,
          severity: data.severity,
          priority: data.priority,
          patient_name: data.patientName,
          patient_age: data.patientAge,
          patient_gender: data.patientGender,
          vitals: data.vitals ?? {},
          location_text: data.locationText,
          notes: data.notes,
        });

        if (insertError) throw insertError;
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create request');
        return false;
      }
    },
    [user],
  );

  return { requests, loading, error, updateRequestStatus, createRequest };
}

function dbStatusToFrontend(status: string): MockRequest['status'] {
  switch (status) {
    case 'en_route': return 'enRoute';
    default: return status as MockRequest['status'];
  }
}
