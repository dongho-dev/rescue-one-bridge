vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHospitalAvailability } from '../useHospitalAvailability';
import { supabase } from '@/lib/supabase';

describe('useHospitalAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches availability via RPC on mount', async () => {
    const mockData = [
      {
        hospital_id: 'h1',
        hospital_name: 'Hospital A',
        accepting: true,
        available_beds: 5,
        queue: 2,
        specialties: [],
        contact: null,
        avg_wait_time: 20,
      },
    ];
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useHospitalAvailability());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hospitals).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('get_hospital_availability');
  });

  it('sets error on RPC failure', async () => {
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    });

    const { result } = renderHook(() => useHospitalAvailability());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hospitals).toEqual([]);
    expect(result.current.error).toBe('RPC error');
  });

  it('sets empty hospitals on unexpected error', async () => {
    (supabase.rpc as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useHospitalAvailability());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hospitals).toEqual([]);
    expect(result.current.error).toBe('병원 현황을 불러오는 중 오류가 발생했습니다.');
  });

  it('refetch calls RPC again', async () => {
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useHospitalAvailability());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Clear and refetch
    vi.clearAllMocks();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ hospital_id: 'h2' }],
      error: null,
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_hospital_availability');
  });
});
