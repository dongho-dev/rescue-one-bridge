import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const GRACE_MS = 5 * 60 * 1000; // 5 minute grace after warning
const THROTTLE_MS = 60 * 1000; // check every 60s

export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Throttled activity tracker
    let lastThrottle = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottle < THROTTLE_MS) return;
      lastThrottle = now;
      resetActivity();
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    // Check interval
    timerRef.current = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;

      if (idle >= TIMEOUT_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        toast.warning('5분 후 자동 로그아웃됩니다. 화면을 터치하세요.', { duration: 10000 });
      }

      if (idle >= TIMEOUT_MS + GRACE_MS) {
        signOut();
        toast.error('보안을 위해 자동 로그아웃되었습니다.');
      }
    }, THROTTLE_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, signOut, resetActivity]);
}
