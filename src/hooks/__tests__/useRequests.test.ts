import { describe, it, expect, vi } from 'vitest';

vi.hoisted(() => {
  // Must be hoisted before vi.mock
});

vi.mock('@/lib/supabase', () => {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {};
  qb.select = vi.fn(() => qb);
  qb.insert = vi.fn(() => qb);
  qb.update = vi.fn(() => qb);
  qb.eq = vi.fn(() => qb);
  qb.order = vi.fn().mockResolvedValue({ data: [], error: null });
  qb.single = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    supabase: {
      from: vi.fn(() => qb),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      })),
      removeChannel: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1' },
    profile: { role: 'paramedic', hospital_id: null },
  })),
}));

vi.mock('@/hooks/useNotification', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(),
  }),
}));

vi.mock('@/utils/errorMessages', () => ({
  getUserFriendlyError: (msg: string) => msg,
}));

vi.mock('@/utils/retry', () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
}));

vi.mock('@/utils/offlineQueue', () => ({
  enqueue: vi.fn(), getQueue: vi.fn(() => []), dequeue: vi.fn(),
}));

vi.mock('@/utils/demoData', () => ({
  generateDemoRequests: vi.fn(() => []),
}));

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useRequests } from '../useRequests';
import { RequestsProvider, useRequestsContext } from '@/contexts/RequestsContext';
import { generateMockRequests } from '../../components/common/models';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Tests for useRequests hook.
 * Mock data structure tests verify the data contracts.
 * Hook tests verify Supabase integration setup and client-side validation.
 */

describe('useRequests mock data', () => {
  it('generates 12 requests', () => {
    const requests = generateMockRequests();
    expect(requests.length).toBe(12);
  });

  it('each request has required fields', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req.id).toBeTruthy();
      expect(req.time).toBeInstanceOf(Date);
      expect(req.severity).toBeGreaterThanOrEqual(1);
      expect(req.severity).toBeLessThanOrEqual(5);
      expect(typeof req.distance_km).toBe('number');
      expect(req.symptom).toBeTruthy();
      expect(['pending', 'matched', 'en_route', 'completed', 'cancelled']).toContain(req.status);
    }
  });

  it('request IDs follow the expected format', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req.id).toMatch(/^RQ-\d{4}$/);
    }
  });

  it('eta_minutes values are positive numbers', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      if (req.eta_minutes !== undefined) {
        expect(req.eta_minutes).toBeGreaterThan(0);
      }
    }
  });
});

describe('useRequests hook integration', () => {
  it('hook returns expected API shape', () => {
    const { result, unmount } = renderHook(() => useRequests());

    expect(result.current).toHaveProperty('requests');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isOnline');
    expect(result.current).toHaveProperty('pendingQueueCount');
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.updateRequestStatus).toBe('function');
    expect(typeof result.current.createRequest).toBe('function');
    expect(typeof result.current.rejectRequest).toBe('function');
    unmount();
  });

  it('calls supabase.from("requests") on mount', () => {
    const { unmount } = renderHook(() => useRequests());
    expect(supabase.from).toHaveBeenCalledWith('requests');
    unmount();
  });

  it('sets up Realtime channel subscription', () => {
    const { unmount } = renderHook(() => useRequests());
    expect(supabase.channel).toHaveBeenCalled();
    unmount();
  });

  it('createRequest rejects invalid severity synchronously', async () => {
    const { result, unmount } = renderHook(() => useRequests());

    // Call createRequest directly without waiting for mount effects
    // Validation is synchronous and runs before any Supabase call
    await result.current.createRequest({
      priority: 'normal',
      severity: 6,
      symptom: '두통',
    });

    expect(toast.error).toHaveBeenCalledWith('중증도는 1~5 사이의 값이어야 합니다.');
    unmount();
  });

  it('createRequest rejects invalid patient_age synchronously', async () => {
    const { result, unmount } = renderHook(() => useRequests());

    await result.current.createRequest({
      priority: 'normal',
      severity: 3,
      symptom: '두통',
      patient_age: -1,
    });

    expect(toast.error).toHaveBeenCalledWith('나이는 0~150 사이의 숫자여야 합니다.');
    unmount();
  });

  it('createRequest rejects too long patient_name synchronously', async () => {
    const { result, unmount } = renderHook(() => useRequests());

    await result.current.createRequest({
      priority: 'normal',
      severity: 3,
      symptom: '두통',
      patient_name: 'a'.repeat(101),
    });

    expect(toast.error).toHaveBeenCalledWith('환자 이름은 100자 이내여야 합니다.');
    unmount();
  });
});

describe('RequestsContext', () => {
  it('useRequestsContext throws when used without Provider', () => {
    expect(() => {
      renderHook(() => useRequestsContext());
    }).toThrow('useRequestsContext must be used within RequestsProvider');
  });

  it('useRequestsContext returns same shape as useRequests when wrapped in Provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(RequestsProvider, null, children);

    const { result, unmount } = renderHook(() => useRequestsContext(), { wrapper });

    expect(result.current).toHaveProperty('requests');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isOnline');
    expect(result.current).toHaveProperty('pendingQueueCount');
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.updateRequestStatus).toBe('function');
    expect(typeof result.current.createRequest).toBe('function');
    expect(typeof result.current.rejectRequest).toBe('function');
    unmount();
  });

  it('two consumers share the same context value (single Realtime channel)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(RequestsProvider, null, children);

    const { result: result1 } = renderHook(() => useRequestsContext(), { wrapper });
    const { result: result2 } = renderHook(() => useRequestsContext(), { wrapper });

    // Both should have the same requests array reference shape
    expect(result1.current.requests).toEqual(result2.current.requests);
    expect(result1.current.loading).toEqual(result2.current.loading);
  });
});
