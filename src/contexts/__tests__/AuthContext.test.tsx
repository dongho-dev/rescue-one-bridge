import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// ---- Hoisted mutable flags ----
const mockFlags = vi.hoisted(() => ({
  explicitDemoMode: false,
  isEnvMissing: false,
}));

// ---- Mocks ----
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
  get explicitDemoMode() {
    return mockFlags.explicitDemoMode;
  },
  get isEnvMissing() {
    return mockFlags.isEnvMissing;
  },
}));

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/utils/offlineQueue', () => ({
  clearQueue: vi.fn(),
}));

vi.mock('@/utils/oauthMetaSigning', () => ({
  verifyOAuthMeta: vi.fn(),
}));

import { AuthProvider, useAuth } from '../AuthContext';
import { toast } from 'sonner';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  let authCallback: ((event: string, session: unknown) => Promise<void>) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
    mockFlags.explicitDemoMode = false;
    mockFlags.isEnvMissing = false;

    // Default: onAuthStateChange captures the callback and returns a subscription
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => Promise<void>) => {
      authCallback = cb;
      return {
        data: {
          subscription: { unsubscribe: mockUnsubscribe },
        },
      };
    });

    // Default: profile fetch returns paramedic
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'paramedic', hospital_id: null, display_name: 'Test' },
            error: null,
          }),
        }),
      }),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---------- 1. Demo mode ----------
  it('sets isDemoMode and demo profile when explicitDemoMode is true', async () => {
    mockFlags.explicitDemoMode = true;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isDemoMode).toBe(true);
    expect(result.current.profile?.role).toBe('hospital_staff');
    expect(result.current.profile?.display_name).toBe('Demo User');
    expect(result.current.user?.id).toBe('demo-user');
  });

  // ---------- 2. switchDemoRole ----------
  it('toggles role when switchDemoRole is called in demo mode', async () => {
    mockFlags.explicitDemoMode = true;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.role).toBe('hospital_staff');
    expect(result.current.switchDemoRole).toBeDefined();

    act(() => {
      result.current.switchDemoRole!();
    });

    expect(result.current.profile?.role).toBe('paramedic');
    expect(result.current.profile?.hospital_id).toBeNull();

    act(() => {
      result.current.switchDemoRole!();
    });

    expect(result.current.profile?.role).toBe('hospital_staff');
    expect(result.current.profile?.hospital_id).toBe('demo-hospital');
  });

  // ---------- 3. applyOAuthSignupMeta ----------
  it('applies OAuth signup meta on SIGNED_IN event', async () => {
    const { verifyOAuthMeta } = await import('@/utils/oauthMetaSigning');
    const verifyMock = vi.mocked(verifyOAuthMeta);
    verifyMock.mockReturnValue({ role: 'hospital_staff', hospitalId: 'h-123' });

    localStorage.setItem('oauth_signup_meta', JSON.stringify({ data: 'test', sig: 'test' }));
    mockRpc.mockResolvedValue({ error: null });

    renderHook(() => useAuth(), { wrapper });

    // Simulate SIGNED_IN event
    await act(async () => {
      await authCallback!('SIGNED_IN', {
        user: { id: 'user-1' },
      });
    });

    expect(verifyMock).toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith('apply_oauth_role', { p_role: 'hospital_staff' });
    expect(mockRpc).toHaveBeenCalledWith('link_hospital', { p_hospital_id: 'h-123' });
    expect(localStorage.getItem('oauth_signup_meta')).toBeNull();
  });

  // ---------- 4. Duplicate application prevention ----------
  it('does not apply OAuth meta twice (oauthMetaApplied ref guard)', async () => {
    const { verifyOAuthMeta } = await import('@/utils/oauthMetaSigning');
    const verifyMock = vi.mocked(verifyOAuthMeta);
    verifyMock.mockReturnValue({ role: 'paramedic', hospitalId: null });

    localStorage.setItem('oauth_signup_meta', JSON.stringify({ data: 'test', sig: 'test' }));
    mockRpc.mockResolvedValue({ error: null });

    renderHook(() => useAuth(), { wrapper });

    // First SIGNED_IN
    await act(async () => {
      await authCallback!('SIGNED_IN', {
        user: { id: 'user-1' },
      });
    });

    // Put meta back to simulate a second event
    localStorage.setItem('oauth_signup_meta', JSON.stringify({ data: 'test', sig: 'test' }));

    // Second SIGNED_IN (same component instance)
    await act(async () => {
      await authCallback!('SIGNED_IN', {
        user: { id: 'user-1' },
      });
    });

    // verifyOAuthMeta should have been called only once (guard prevents re-entry)
    expect(verifyMock).toHaveBeenCalledTimes(1);
  });

  // ---------- 5. Role fallback ----------
  it('falls back to paramedic when profile has invalid role', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'admin_super_hacker', hospital_id: null, display_name: 'Hacker' },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await authCallback!('INITIAL_SESSION', {
        user: { id: 'user-2' },
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.role).toBe('paramedic');
  });

  // ---------- 6. signOut failure still clears local state ----------
  it('clears local state even when signOut API call fails', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Network error' } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // First, simulate a logged-in user
    await act(async () => {
      await authCallback!('INITIAL_SESSION', {
        user: { id: 'user-3' },
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).not.toBeNull();
    });

    // Now sign out
    await act(async () => {
      await result.current.signOut();
    });

    // Local state should be cleared regardless of API failure
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    // Should show error toast
    expect(toast.error).toHaveBeenCalled();
  });

  // ---------- 7. isEnvMissing ----------
  it('sets loading to false and profile to null when isEnvMissing is true', async () => {
    mockFlags.isEnvMissing = true;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isEnvMissing).toBe(true);
  });
});
