import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mockBeds, type BedInfo } from '../mocks/bedData';

interface UseBedsReturn {
  beds: BedInfo[];
  loading: boolean;
  error: string | null;
  updateBedStatus: (bedId: string, status: BedInfo['status']) => void;
}

export function useBeds(): UseBedsReturn {
  const { profile } = useAuth();
  const [beds, setBeds] = useState<BedInfo[]>(mockBeds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !profile?.hospital_id) return;

    let cancelled = false;

    const fetchBeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase!
          .from('beds')
          .select(`
            id, section, number, status, last_cleaned, notes,
            patients!bed_id (name, id, admission_time, diagnosis)
          `)
          .eq('hospital_id', profile.hospital_id!)
          .order('section')
          .order('number');

        if (fetchError) throw fetchError;
        if (cancelled) return;

        const mapped: BedInfo[] = (data ?? []).map((bed: Record<string, unknown>) => {
          const patients = bed.patients as Record<string, unknown>[] | null;
          const patient = patients?.[0];
          return {
            id: `${bed.section}-${bed.number}`,
            section: bed.section as string,
            number: bed.number as string,
            status: bed.status as BedInfo['status'],
            patient: patient
              ? {
                  name: patient.name as string,
                  id: (patient.id as string).slice(0, 8),
                  admissionTime: new Date(patient.admission_time as string).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                  diagnosis: patient.diagnosis as string,
                }
              : undefined,
            equipment: [],
            lastCleaned: bed.last_cleaned
              ? new Date(bed.last_cleaned as string).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '-',
            notes: bed.notes as string | undefined,
            _supabaseId: bed.id as string,
          };
        });

        setBeds(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch beds');
          setBeds(mockBeds);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBeds();

    // Realtime subscription with hospital_id filter and unique channel name
    const channel = supabase!
      .channel(`beds-changes-${profile.hospital_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'beds',
        filter: `hospital_id=eq.${profile.hospital_id}`
      }, () => {
        fetchBeds();
      })
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [profile?.hospital_id]);

  const updateBedStatus = useCallback(
    (bedId: string, status: BedInfo['status']) => {
      setBeds(prev => prev.map(b => (b.id === bedId ? { ...b, status } : b)));

      if (supabase && profile?.hospital_id) {
        const [section, number] = bedId.split('-');
        supabase
          .from('beds')
          .update({ status })
          .eq('hospital_id', profile.hospital_id)
          .eq('section', section)
          .eq('number', number)
          .then(({ error: err }) => {
            if (err) console.error('Bed status update failed:', err);
          });
      }
    },
    [profile?.hospital_id],
  );

  return { beds, loading, error, updateBedStatus };
}
