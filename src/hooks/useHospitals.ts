import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateMockHospitals, type MockHospital } from '../components/common/models';

interface UseHospitalsReturn {
  hospitals: MockHospital[];
  loading: boolean;
  error: string | null;
}

export function useHospitals(): UseHospitalsReturn {
  const [hospitals, setHospitals] = useState<MockHospital[]>(() => generateMockHospitals());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    const fetchHospitals = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase!.rpc('get_hospital_availability');
        if (fetchError) throw fetchError;
        if (cancelled) return;

        const mapped: MockHospital[] = (data ?? []).map((h: Record<string, unknown>, i: number) => ({
          id: `H-${String(i + 1).padStart(3, '0')}`,
          name: h.hospital_name as string,
          accepting: h.accepting as boolean,
          queue: (h.queue as number) ?? 0,
          beds: Number(h.available_beds ?? 0),
          specialties: (h.specialties as string[]) ?? [],
          distanceKm: null, // Real geolocation not yet implemented; null indicates unknown
          contact: h.contact as string | undefined,
          avgWaitTime: h.avg_wait_time as number | undefined,
        }));

        setHospitals(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch hospitals');
          setHospitals(generateMockHospitals());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHospitals();

    const channel = supabase!
      .channel('hospitals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => {
        fetchHospitals();
      })
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, []);

  return { hospitals, loading, error };
}
