import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { mockBeds } from '@/mocks/bedData';
import type { Bed, BedStatus } from '@/types/database';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errorMessages';

export function useBeds() {
  const { data: beds, loading, error, refetch, setData } = useSupabaseQuery<Bed>({
    table: 'beds',
    fallback: mockBeds,
    realtime: true,
  });

  const updateBedStatus = useCallback(async (bedId: string, status: BedStatus) => {
    let previousData: Bed[] = [];
    setData(prev => {
      previousData = prev;
      return prev.map(b => b.id === bedId ? { ...b, status } : b);
    });

    const { error } = await supabase
      .from('beds')
      .update({ status })
      .eq('id', bedId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      setData(previousData);
    }
  }, [setData]);

  return { beds, loading, error, refetch, updateBedStatus };
}
