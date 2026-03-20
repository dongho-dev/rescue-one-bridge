import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AuditAction = 'view' | 'create' | 'update' | 'delete';
type ResourceType = 'request' | 'patient' | 'bed' | 'staff' | 'equipment';

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(async (
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    metadata?: Record<string, unknown>,
  ) => {
    if (!user || !supabase) return;

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId ?? null,
        metadata: metadata ?? {},
      });
    } catch {
      // 감사 로그 실패가 메인 플로우를 막아서는 안 됨
      console.warn('[audit] log failed');
    }
  }, [user]);

  return { log };
}
