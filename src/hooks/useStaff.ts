import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { mockStaff } from '@/mocks/staffData';
import type { Staff, StaffStatus } from '@/types/database';
import { toast } from 'sonner';

export function useStaff() {
  const { data: staff, loading, error, refetch, setData } = useSupabaseQuery<Staff>({
    table: 'staff',
    fallback: mockStaff,
    realtime: true,
  });

  const updateStaffStatus = useCallback(async (staffId: string, status: StaffStatus) => {
    setData(prev => prev.map(s => s.id === staffId ? { ...s, status } : s));

    const { error } = await supabase
      .from('staff')
      .update({ status })
      .eq('id', staffId);

    if (error) {
      toast.error(`직원 상태 변경 실패: ${error.message}`);
      await refetch();
    }
  }, [setData, refetch]);

  return { staff, loading, error, refetch, updateStaffStatus };
}
