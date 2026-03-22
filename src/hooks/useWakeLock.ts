import { useState, useCallback, useEffect, useRef } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const releaseHandlerRef = useRef<(() => void) | null>(null);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      const handler = () => setIsActive(false);
      releaseHandlerRef.current = handler;
      wakeLockRef.current.addEventListener('release', handler);
      setIsActive(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        if (releaseHandlerRef.current) {
          wakeLockRef.current.removeEventListener('release', releaseHandlerRef.current);
          releaseHandlerRef.current = null;
        }
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  return { isActive, request, release };
}
