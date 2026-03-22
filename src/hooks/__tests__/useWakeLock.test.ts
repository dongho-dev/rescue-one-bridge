import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../useWakeLock';

describe('useWakeLock', () => {
  let mockSentinel: {
    release: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSentinel = {
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: vi.fn().mockResolvedValue(mockSentinel),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initially has isActive as false', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isActive).toBe(false);
  });

  it('request activates the wake lock', async () => {
    const { result } = renderHook(() => useWakeLock());

    let success = false;
    await act(async () => {
      success = (await result.current.request()) as unknown as boolean;
    });

    expect(success).toBe(true);
    expect(result.current.isActive).toBe(true);
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
  });

  it('request returns false when wakeLock API is not available', async () => {
    // Remove wakeLock
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useWakeLock());

    let success = true;
    await act(async () => {
      success = (await result.current.request()) as unknown as boolean;
    });

    expect(success).toBe(false);
    expect(result.current.isActive).toBe(false);
  });

  it('request returns false when wakeLock.request throws', async () => {
    (navigator.wakeLock.request as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('NotAllowedError')
    );

    const { result } = renderHook(() => useWakeLock());

    let success = true;
    await act(async () => {
      success = (await result.current.request()) as unknown as boolean;
    });

    expect(success).toBe(false);
    expect(result.current.isActive).toBe(false);
  });

  it('release deactivates the wake lock', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });
    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await result.current.release();
    });

    expect(mockSentinel.release).toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);
  });

  it('release is safe to call when no lock is held', async () => {
    const { result } = renderHook(() => useWakeLock());

    // Should not throw
    await act(async () => {
      await result.current.release();
    });

    expect(result.current.isActive).toBe(false);
  });
});
