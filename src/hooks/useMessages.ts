import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useNotification } from './useNotification';

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
  sendMessage: (content: string) => Promise<void>;
}

export function useMessages(requestId: string | null): UseMessagesReturn {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { notify } = useNotification();

  // 메시지 조회
  useEffect(() => {
    if (!requestId || !supabase) {
      setMessages([]);
      return;
    }

    setLoading(true);
    supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as Message[]);
        setLoading(false);
      });
  }, [requestId]);

  // 실시간 구독
  useEffect(() => {
    if (!requestId || !supabase) return;

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);

        // 상대방 메시지면 알림
        if (msg.sender_id !== user?.id) {
          const sender = msg.sender_role === 'hospital_staff' ? '병원' : '구급대원';
          notify(`${sender} 메시지`, {
            body: msg.content,
            tag: `msg-${msg.id}`,
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [requestId, user?.id, notify]);

  const sendMessage = useCallback(async (content: string) => {
    if (!requestId || !user || !profile || !supabase) return;
    if (!content.trim()) return;

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      sender_role: profile.role,
      content: content.trim(),
    });
  }, [requestId, user, profile]);

  return { messages, loading, sendMessage };
}
