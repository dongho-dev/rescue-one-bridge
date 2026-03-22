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
    const discharge_time = status === 'discharged' ? new Date().toISOString() : undefined;
    setData(prev => prev.map(p => p.id === patientId ? { ...p, status, ...(discharge_time ? { discharge_time } : {}) } : p));

    if (!supabase) return;

    const updatePayload: Record<string, unknown> = { status };
    if (discharge_time) {
      updatePayload.discharge_time = discharge_time;
    }

    const { error } = await supabase
      .from('patients')
      .update(updatePayload)
      .eq('id', patientId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      await refetch();
    }
  }, [setData, refetch]);

  return { patients, loading, error, refetch, updatePatientStatus };
}
