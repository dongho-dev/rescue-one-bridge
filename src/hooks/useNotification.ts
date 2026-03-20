import { useState, useEffect, useCallback } from 'react';

type PermissionState = NotificationPermission | 'unsupported';

interface UseNotificationReturn {
  permission: PermissionState;
  requestPermission: () => Promise<boolean>;
  notify: (title: string, options?: NotificationOptions) => void;
}

export function useNotification(): UseNotificationReturn {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    // 페이지가 포커스 상태면 브라우저 알림 불필요 (토스트로 충분)
    if (document.hasFocus()) return;

    const notification = new Notification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: options?.tag || 'r1b-default',
      ...options,
    });

    // 알림 클릭 시 앱으로 포커스
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, []);

  return { permission, requestPermission, notify };
}
