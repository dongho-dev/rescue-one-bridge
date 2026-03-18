import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { mockEquipment } from '@/mocks/equipmentData';
import type { Equipment, EquipmentStatus } from '@/types/database';
import { toast } from 'sonner';

export function useEquipment() {
  const { data: equipment, loading, error, refetch, setData } = useSupabaseQuery<Equipment>({
    table: 'equipment',
    fallback: mockEquipment,
    realtime: true,
  });

  const updateEquipmentStatus = useCallback(async (equipmentId: string, status: EquipmentStatus) => {
    let previousData: Equipment[] = [];
    setData(prev => {
      previousData = prev;
      return prev.map(e => e.id === equipmentId ? { ...e, status } : e);
    });

    const { error } = await supabase
      .from('equipment')
      .update({ status })
      .eq('id', equipmentId);

    if (error) {
      toast.error(`장비 상태 변경 실패: ${error.message}`);
      setData(previousData);
    }
  }, [setData]);

  return { equipment, loading, error, refetch, updateEquipmentStatus };
}
