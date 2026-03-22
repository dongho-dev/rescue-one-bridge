vi.mock('@/lib/supabase', () => {
  const fromMock = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
  return {
    supabase: {
      from: vi.fn(() => fromMock),
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocationSharing } from '../useLocationSharing';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

describe('useLocationSharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not start interval when not active', () => {
    renderHook(() =>
      useLocationSharing('req-1', { latitude: 37.5, longitude: 127.0 }, false)
    );

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('does not start interval when requestId is null', () => {
    renderHook(() =>
      useLocationSharing(null, { latitude: 37.5, longitude: 127.0 }, true)
    );

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('sends location immediately when active', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ error: null });

    renderHook(() =>
      useLocationSharing('req-1', { latitude: 37.5, longitude: 127.0 }, true)
    );

    // Immediate call on activation
    expect(supabase.from).toHaveBeenCalledWith('requests');
  });

  it('sends location updates at interval', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ error: null });

    renderHook(() =>
      useLocationSharing('req-1', { latitude: 37.5, longitude: 127.0 }, true)
    );

    // Clear the immediate call count
    const initialCallCount = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance by 15 seconds (UPDATE_INTERVAL_MS)
    vi.advanceTimersByTime(15_000);

    expect((supabase.from as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('shows error toast after consecutive errors', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.eq.mockResolvedValue({ error: { message: 'network error' } });

    renderHook(() =>
      useLocationSharing('req-1', { latitude: 37.5, longitude: 127.0 }, true)
    );

    // Wait for first call to complete
    await vi.advanceTimersByTimeAsync(0);

    // Trigger 2 more interval calls (total 3 = MAX_CONSECUTIVE_ERRORS)
    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(15_000);

    expect(toast.error).toHaveBeenCalledWith(
      '위치 정보 전송에 실패하고 있습니다. 네트워크를 확인해주세요.'
    );
  });

  it('clears interval on unmount', () => {
    const { unmount } = renderHook(() =>
      useLocationSharing('req-1', { latitude: 37.5, longitude: 127.0 }, true)
    );

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
