vi.mock('@/lib/supabase', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  const fromMock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
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
    profile: { role: 'paramedic', hospital_id: null },
  })),
}));

vi.mock('@/hooks/useNotification', () => ({
  useNotification: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages } from '../useMessages';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty messages when requestId is null', async () => {
    const { result } = renderHook(() => useMessages(null));

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches messages for a given requestId', async () => {
    const mockMessages = [
      { id: 'm1', request_id: 'r1', sender_id: 'user-2', sender_role: 'hospital_staff', content: 'Hello', created_at: new Date().toISOString() },
    ];
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.order.mockResolvedValue({ data: mockMessages, error: null });

    const { result } = renderHook(() => useMessages('r1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual(mockMessages);
  });

  it('sets empty messages on fetch error', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.order.mockResolvedValue({ data: null, error: { message: 'fetch error' } });

    const { result } = renderHook(() => useMessages('r1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
  });

  it('sendMessage inserts into supabase and returns true', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.order.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useMessages('r1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock insert for sendMessage
    fromMock.insert.mockResolvedValue({ data: null, error: null });

    let success = false;
    await act(async () => {
      success = await result.current.sendMessage('Hello');
    });

    expect(success).toBe(true);
  });

  it('sendMessage returns false on error', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.order.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useMessages('r1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    fromMock.insert.mockResolvedValue({ data: null, error: { message: 'insert error' } });

    let success = true;
    await act(async () => {
      success = await result.current.sendMessage('Hello');
    });

    expect(success).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('sendMessage rejects empty content', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.order.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useMessages('r1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    let success = true;
    await act(async () => {
      success = await result.current.sendMessage('   ');
    });

    expect(success).toBe(false);
  });

  it('creates Realtime subscription for messages', async () => {
    const fromMock = (supabase.from as ReturnType<typeof vi.fn>)();
    fromMock.order.mockResolvedValue({ data: [], error: null });

    renderHook(() => useMessages('r1'));

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('messages:r1');
    });
  });
});
