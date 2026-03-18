import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { mockStaff } from '@/mocks/staffData';
import type { Staff, StaffStatus } from '@/types/database';
import { toast } from 'sonner';
import { getUserFriendlyError } from '@/utils/errorMessages';

export function useStaff() {
  const { data: staff, loading, error, refetch, setData } = useSupabaseQuery<Staff>({
    table: 'staff',
    fallback: mockStaff,
    realtime: true,
  });

  const updateStaffStatus = useCallback(async (staffId: string, status: StaffStatus) => {
    let previousData: Staff[] = [];
    setData(prev => {
      previousData = prev;
      return prev.map(s => s.id === staffId ? { ...s, status } : s);
    });

    const { error } = await supabase
      .from('staff')
      .update({ status })
      .eq('id', staffId);

    if (error) {
      toast.error(getUserFriendlyError(error.message));
      setData(previousData);
    }
  }, [setData]);

  return { staff, loading, error, refetch, updateStaffStatus };
}
