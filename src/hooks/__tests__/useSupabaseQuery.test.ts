vi.mock('@/lib/supabase', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  const fromMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      from: vi.fn(() => fromMock),
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1' },
    profile: { role: 'hospital_staff', hospital_id: 'h-1' },
  })),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSupabaseQuery } from '../useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const fallbackData = [{ id: 'fallback-1', name: 'Fallback Item' }];

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data from supabase', async () => {
    const rows = [{ id: 'row-1', name: 'Test' }];
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ data: rows, error: null });

    const { result } = renderHook(() =>
      useSupabaseQuery({ table: 'beds', fallback: fallbackData }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(rows);
    expect(result.current.error).toBeNull();
  });

  it('falls back to provided data when no hospital_id', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1' },
      profile: { role: 'hospital_staff', hospital_id: null },
    });

    const { result } = renderHook(() =>
      useSupabaseQuery({ table: 'beds', fallback: fallbackData }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(fallbackData);
  });

  it('falls back on fetch error', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1' },
      profile: { role: 'hospital_staff', hospital_id: 'h-1' },
    });

    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ data: null, error: { message: 'Network error' } });

    const { result } = renderHook(() =>
      useSupabaseQuery({ table: 'beds', fallback: fallbackData }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(fallbackData);
    expect(result.current.error).toBe('Network error');
  });

  it('creates Realtime channel when realtime is true', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1' },
      profile: { role: 'hospital_staff', hospital_id: 'h-1' },
    });

    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ data: [], error: null });

    renderHook(() => useSupabaseQuery({ table: 'beds', fallback: fallbackData, realtime: true }));

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('beds:hospital:h-1');
    });
  });

  it('does not create Realtime channel when realtime is false', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1' },
      profile: { role: 'hospital_staff', hospital_id: 'h-1' },
    });

    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ data: [], error: null });

    renderHook(() => useSupabaseQuery({ table: 'beds', fallback: fallbackData, realtime: false }));

    await waitFor(() => {
      expect(supabase.channel).not.toHaveBeenCalled();
    });
  });

  it('skips fetch when enabled is false', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user-1' },
      profile: { role: 'hospital_staff', hospital_id: 'h-1' },
    });

    const { result } = renderHook(() =>
      useSupabaseQuery({ table: 'beds', fallback: fallbackData, enabled: false }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(fallbackData);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
