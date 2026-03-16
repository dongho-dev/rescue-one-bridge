import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mockEquipment, type Equipment } from '../mocks/equipmentData';

interface UseEquipmentReturn {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
  updateEquipmentStatus: (equipmentId: string, status: Equipment['status']) => void;
}

export function useEquipment(): UseEquipmentReturn {
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !profile?.hospital_id) return;

    let cancelled = false;

    const fetchEquipment = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase!
          .from('equipment')
          .select('*')
          .eq('hospital_id', profile.hospital_id!)
          .order('name');

        if (fetchError) throw fetchError;
        if (cancelled) return;

        const mapped: Equipment[] = (data ?? []).map((e: Record<string, unknown>) => ({
          id: (e.id as string).slice(0, 5).toUpperCase(),
          name: e.name as string,
          type: e.type as Equipment['type'],
          model: (e.model as string) ?? '-',
          manufacturer: (e.manufacturer as string) ?? '-',
          status: e.status as Equipment['status'],
          location: (e.location as string) ?? '-',
          lastMaintenance: (e.last_maintenance as string) ?? '-',
          nextMaintenance: (e.next_maintenance as string) ?? '-',
          batteryLevel: e.battery_level as number | undefined,
          usageHours: (e.usage_hours as number) ?? 0,
          alerts: (e.alerts as string[]) ?? [],
          assignedTo: undefined,
          notes: e.notes as string | undefined,
          _supabaseId: e.id as string,
        }));

        setEquipment(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
          setEquipment(mockEquipment);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEquipment();

    const channel = supabase!
      .channel('equipment-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => {
        fetchEquipment();
      })
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [profile?.hospital_id]);

  const updateEquipmentStatus = useCallback(
    (equipmentId: string, status: Equipment['status']) => {
      setEquipment(prev => prev.map(e => (e.id === equipmentId ? { ...e, status } : e)));

      if (supabase) {
        const item = equipment.find(e => e.id === equipmentId);
        const supabaseId = (item as Record<string, unknown> | undefined)?._supabaseId as string | undefined;
        if (supabaseId) {
          supabase
            .from('equipment')
            .update({ status })
            .eq('id', supabaseId)
            .then(({ error: err }) => {
              if (err) console.error('Equipment status update failed:', err);
            });
        }
      }
    },
    [equipment],
  );

  return { equipment, loading, error, updateEquipmentStatus };
}
