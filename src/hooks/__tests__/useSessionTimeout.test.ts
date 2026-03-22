import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock AuthContext before importing the hook
const mockSignOut = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    signOut: mockSignOut,
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

import { useSessionTimeout } from '../useSessionTimeout';
import { toast } from 'sonner';

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not warn or sign out before timeout', () => {
    renderHook(() => useSessionTimeout());

    // Advance 10 minutes (less than 30 min timeout)
    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(toast.warning).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('shows warning after 30 minutes of inactivity', () => {
    renderHook(() => useSessionTimeout());

    // Advance past the 30-minute timeout (need to reach the check interval)
    vi.advanceTimersByTime(31 * 60 * 1000);

    expect(toast.warning).toHaveBeenCalledWith('5분 후 자동 로그아웃됩니다. 화면을 터치하세요.', {
      duration: 10000,
    });
  });

  it('signs out after 35 minutes of inactivity (30 min + 5 min grace)', () => {
    renderHook(() => useSessionTimeout());

    // Advance past the full timeout + grace period
    vi.advanceTimersByTime(36 * 60 * 1000);

    expect(mockSignOut).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('보안을 위해 자동 로그아웃되었습니다.');
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useSessionTimeout());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
