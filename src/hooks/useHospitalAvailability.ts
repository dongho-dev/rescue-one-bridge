import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HospitalAvailability } from '@/types/database';

export function useHospitalAvailability() {
  const [hospitals, setHospitals] = useState<HospitalAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!supabase) {
      setHospitals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_hospital_availability');

      if (fetchError) {
        console.warn('[hospital_availability] fetch failed:', fetchError.message);
        setError(fetchError.message);
        setHospitals([]);
      } else {
        setHospitals((data ?? []) as HospitalAvailability[]);
      }
    } catch (err) {
      console.error('[hospital_availability] unexpected error:', err);
      setError('병원 현황을 불러오는 중 오류가 발생했습니다.');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return { hospitals, loading, error, refetch: fetchAvailability };
}
