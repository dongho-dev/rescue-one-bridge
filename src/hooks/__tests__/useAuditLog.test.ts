import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Supabase
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

// Mock AuthContext with a variable we can control
let mockUser: { id: string } | null = { id: 'test-user-id' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

import { useAuditLog } from '../useAuditLog';

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'test-user-id' };
  });

  it('inserts audit log entry with correct data', async () => {
    const { result } = renderHook(() => useAuditLog());

    await act(async () => {
      await result.current.log('create', 'patient', 'patient-123', { detail: 'test' });
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'test-user-id',
      action: 'create',
      resource_type: 'patient',
      resource_id: 'patient-123',
      metadata: { detail: 'test' },
    });
  });

  it('uses null for optional resourceId when not provided', async () => {
    const { result } = renderHook(() => useAuditLog());

    await act(async () => {
      await result.current.log('view', 'request');
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_id: null,
        metadata: {},
      })
    );
  });

  it('does not throw when insert fails', async () => {
    mockInsert.mockRejectedValueOnce(new Error('DB error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useAuditLog());

    // Should not throw
    await act(async () => {
      await result.current.log('delete', 'bed', 'bed-1');
    });

    expect(warnSpy).toHaveBeenCalledWith('[audit] log failed');
    warnSpy.mockRestore();
  });

  it('does not call insert when user is null', async () => {
    mockUser = null;

    const { result } = renderHook(() => useAuditLog());

    await act(async () => {
      await result.current.log('update', 'equipment');
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
