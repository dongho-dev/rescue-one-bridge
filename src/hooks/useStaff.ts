import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mockStaff, type StaffMember } from '../mocks/staffData';

interface UseStaffReturn {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  updateStaffStatus: (staffId: string, status: StaffMember['status']) => void;
}

// DB uses underscores for enum values, frontend uses hyphens
const dbStatusToFrontend = (s: string): StaffMember['status'] =>
  s.replace('_', '-') as StaffMember['status'];

const frontendStatusToDb = (s: string): string =>
  s.replace('-', '_');

export function useStaff(): UseStaffReturn {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !profile?.hospital_id) return;

    let cancelled = false;

    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase!
          .from('staff')
          .select('*')
          .eq('hospital_id', profile.hospital_id!)
          .order('name');

        if (fetchError) throw fetchError;
        if (cancelled) return;

        const mapped: StaffMember[] = (data ?? []).map((s: Record<string, unknown>) => ({
          id: (s.id as string).slice(0, 6).toUpperCase(),
          name: s.name as string,
          role: s.role as StaffMember['role'],
          department: (s.department as string) ?? '-',
          shift: s.shift as StaffMember['shift'],
          status: dbStatusToFrontend(s.status as string),
          phone: (s.phone as string) ?? '-',
          email: (s.email as string) ?? '-',
          specialization: s.specialization as string | undefined,
          yearsOfExperience: (s.years_of_experience as number) ?? 0,
          currentLocation: (s.current_location as string) ?? '-',
          shiftStart: s.shift_start ? (s.shift_start as string).slice(0, 5) : '-',
          shiftEnd: s.shift_end ? (s.shift_end as string).slice(0, 5) : '-',
          certifications: (s.certifications as string[]) ?? [],
          emergencyContact: (s.emergency_contact as string) ?? '-',
          _supabaseId: s.id as string,
        }));

        setStaff(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch staff');
          setStaff(mockStaff);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStaff();

    return () => {
      cancelled = true;
    };
  }, [profile?.hospital_id]);

  const updateStaffStatus = useCallback(
    (staffId: string, status: StaffMember['status']) => {
      const prevStaff = staff;
      setStaff(prev => prev.map(s => (s.id === staffId ? { ...s, status } : s)));

      if (supabase) {
        const member = staff.find(s => s.id === staffId);
        const supabaseId = (member as Record<string, unknown> | undefined)?._supabaseId as string | undefined;
        if (supabaseId) {
          supabase
            .from('staff')
            .update({ status: frontendStatusToDb(status) })
            .eq('id', supabaseId)
            .then(({ error: err }) => {
              if (err) {
                console.error('Staff status update failed:', err);
                setStaff(prevStaff);
              }
            });
        }
      }
    },
    [staff],
  );

  return { staff, loading, error, updateStaffStatus };
}
