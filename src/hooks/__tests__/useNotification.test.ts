import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../useNotification';

describe('useNotification', () => {
  let originalNotificationDesc: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalNotificationDesc = Object.getOwnPropertyDescriptor(globalThis, 'Notification');

    // Mock Notification API
    const MockNotification = vi.fn() as unknown as typeof Notification;
    Object.defineProperty(MockNotification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    });
    MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');
    (MockNotification as unknown as { prototype: { close: unknown } }).prototype.close = vi.fn();

    Object.defineProperty(globalThis, 'Notification', {
      value: MockNotification,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalNotificationDesc) {
      Object.defineProperty(globalThis, 'Notification', originalNotificationDesc);
    }
    vi.restoreAllMocks();
  });

  it('returns initial permission state', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.permission).toBe('default');
  });

  it('returns unsupported when Notification API is not available', () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNotification());
    expect(result.current.permission).toBe('unsupported');
  });

  it('requestPermission returns true when granted', async () => {
    const { result } = renderHook(() => useNotification());

    let granted: boolean = false;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
    expect(result.current.permission).toBe('granted');
  });

  it('requestPermission returns false when denied', async () => {
    Object.defineProperty(Notification, 'permission', {
      value: 'denied',
      configurable: true,
    });

    const { result } = renderHook(() => useNotification());

    let granted: boolean = true;
    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
  });

  it('notify does nothing when permission is not granted', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.notify('Test', { body: 'test body' });
    });

    // Notification constructor should not be called
    expect(Notification).not.toHaveBeenCalled();
  });

  it('notify creates notification when permission is granted and page is not focused', () => {
    Object.defineProperty(Notification, 'permission', {
      value: 'granted',
      configurable: true,
    });
    // Simulate page not focused
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      configurable: true,
    });

    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.notify('Test Title', { body: 'test body' });
    });

    expect(Notification).toHaveBeenCalledWith(
      'Test Title',
      expect.objectContaining({
        body: 'test body',
      }),
    );
  });

  it('notify skips when page is focused', () => {
    Object.defineProperty(Notification, 'permission', {
      value: 'granted',
      configurable: true,
    });
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);

    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.notify('Test Title');
    });

    expect(Notification).not.toHaveBeenCalled();
  });
});
