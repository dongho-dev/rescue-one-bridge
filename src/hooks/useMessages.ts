import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useNotification } from './useNotification';
import { toast } from 'sonner';

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  sender_role: 'hospital_staff' | 'paramedic';
  content: string;
  created_at: string;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string) => Promise<boolean>;
}

export function useMessages(requestId: string | null): UseMessagesReturn {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { notify } = useNotification();

  // 메시지 조회
  useEffect(() => {
    if (!requestId || !supabase) {
      setMessages([]);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('[messages] fetch failed:', error.message);
          setMessages([]);
        } else {
          setMessages((data ?? []) as Message[]);
        }
      } catch (err) {
        console.error('[messages] unexpected error:', err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  // 실시간 구독
  useEffect(() => {
    if (!requestId || !supabase) return;

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);

          // 상대방 메시지면 알림
          if (msg.sender_id !== user?.id) {
            const sender = msg.sender_role === 'hospital_staff' ? '병원' : '구급대원';
            notify(`${sender} 메시지`, {
              body: msg.content,
              tag: `msg-${msg.id}`,
            });
          }
        },
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // 연결 성공 — 에러 상태 클리어
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[messages] realtime ${status}:`, err?.message);
          toast.error('채팅 실시간 연결이 끊어졌습니다. 30초 후 재연결합니다.');
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            setRetryCount((c) => c + 1);
          }, 30_000);
        }
      });

    channelRef.current = channel;

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [requestId, user?.id, notify, retryCount]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!requestId || !user || !profile || !supabase) return false;
      if (!content.trim()) return false;

      try {
        const { error } = await supabase.from('messages').insert({
          request_id: requestId,
          sender_id: user.id,
          sender_role: profile.role,
          content: content.trim(),
        });
        if (error) {
          toast.error('메시지 전송에 실패했습니다.');
          return false;
        }
        return true;
      } catch {
        toast.error('네트워크 오류로 메시지를 전송할 수 없습니다.');
        return false;
      }
    },
    [requestId, user, profile],
  );

  return { messages, loading, sendMessage };
}
