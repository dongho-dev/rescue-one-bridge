import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { mockPatients } from '@/mocks/patientData';
import type { Patient, PatientStatus } from '@/types/database';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errorMessages';

export function usePatients() {
  const { data: patients, loading, error, refetch, setData } = useSupabaseQuery<Patient>({
    table: 'patients',
    fallback: mockPatients,
    realtime: true,
  });

  const updatePatientStatus = useCallback(async (patientId: string, status: PatientStatus) => {
    setData(prev => prev.map(p => p.id === patientId ? { ...p, status } : p));

    const { error } = await supabase
      .from('patients')
      .update({ status })
      .eq('id', patientId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      await refetch();
    }
  }, [setData, refetch]);

  return { patients, loading, error, refetch, updatePatientStatus };
}
