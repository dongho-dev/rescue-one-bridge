import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mockPatients, type Patient } from '../mocks/patientData';

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  updatePatientStatus: (patientId: string, status: Patient['status']) => void;
}

export function usePatients(): UsePatientsReturn {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !profile?.hospital_id) return;

    let cancelled = false;

    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase!
          .from('patients')
          .select(`
            id, name, age, gender, diagnosis, severity, status,
            admission_time, vitals,
            beds!bed_id (section, number)
          `)
          .eq('hospital_id', profile.hospital_id!)
          .order('admission_time', { ascending: false });

        if (fetchError) throw fetchError;
        if (cancelled) return;

        const mapped: Patient[] = (data ?? []).map((p: Record<string, unknown>) => {
          const vitals = (p.vitals ?? {}) as Record<string, unknown>;
          const bed = p.beds as Record<string, unknown> | null;
          return {
            id: (p.id as string).slice(0, 8).toUpperCase(),
            name: p.name as string,
            age: (p.age as number) ?? 0,
            gender: (p.gender as string) ?? '-',
            diagnosis: (p.diagnosis as string) ?? '-',
            severity: p.severity as Patient['severity'],
            admissionTime: new Date(p.admission_time as string).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            bed: bed ? `${bed.section}-${bed.number}` : '-',
            vitals: {
              heartRate: (vitals.heartRate as number) ?? 0,
              bloodPressure: (vitals.bloodPressure as string) ?? '-',
              temperature: (vitals.temperature as number) ?? 0,
              oxygenSaturation: (vitals.oxygenSaturation as number) ?? 0,
            },
            status: p.status as Patient['status'],
            _supabaseId: p.id as string,
          };
        });

        setPatients(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch patients');
          setPatients(mockPatients);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPatients();

    const channel = supabase!
      .channel('patients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchPatients();
      })
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [profile?.hospital_id]);

  const updatePatientStatus = useCallback(
    (patientId: string, status: Patient['status']) => {
      setPatients(prev => prev.map(p => (p.id === patientId ? { ...p, status } : p)));
    },
    [],
  );

  return { patients, loading, error, updatePatientStatus };
}
