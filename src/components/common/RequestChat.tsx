import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Send } from 'lucide-react';

interface RequestChatProps {
  requestId: string | null;
  compact?: boolean;
}

export function RequestChat({ requestId, compact = false }: RequestChatProps) {
  const { messages, loading, sendMessage } = useMessages(requestId);
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!requestId) return null;

  return (
    <Card className={compact ? 'shadow-sm' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare size={16} />
          메시지
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className={`space-y-2 overflow-y-auto mb-3 ${compact ? 'max-h-32' : 'max-h-48'}`}
        >
          {loading && <p className="text-xs text-muted-foreground text-center">로딩 중...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">메시지가 없습니다</p>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-1.5 rounded-lg text-sm ${
                  isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  {!isMine && (
                    <span className="text-xs font-medium opacity-70 block">
                      {msg.sender_role === 'hospital_staff' ? '병원' : '구급대원'}
                    </span>
                  )}
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력..."
            className="text-sm h-9"
          />
          <Button size="sm" className="h-9 px-3 shrink-0" onClick={handleSend} disabled={!input.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
