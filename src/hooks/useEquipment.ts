import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { mockEquipment } from '@/mocks/equipmentData';
import type { Equipment, EquipmentStatus } from '@/types/database';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errorMessages';

export function useEquipment() {
  const {
    data: equipment,
    loading,
    error,
    refetch,
    setData,
  } = useSupabaseQuery<Equipment>({
    table: 'equipment',
    fallback: mockEquipment,
    realtime: true,
    columns:
      'id, name, status, hospital_id, type, last_maintenance, manufacturer, model, location, usage_hours, notes, battery_level, alerts, next_maintenance, assigned_bed_id',
  });

  const updateEquipmentStatus = useCallback(
    async (equipmentId: string, status: EquipmentStatus) => {
      let previousData: Equipment[] = [];
      setData((prev) => {
        previousData = prev;
        return prev.map((e) => (e.id === equipmentId ? { ...e, status } : e));
      });

      const { error } = await supabase.from('equipment').update({ status }).eq('id', equipmentId);

      if (error) {
        toast.error(getUserFriendlyError(error.message));
        setData(previousData);
      }
    },
    [setData],
  );

  return { equipment, loading, error, refetch, updateEquipmentStatus };
}
