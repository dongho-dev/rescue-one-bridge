import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { GeoPosition } from './useGeolocation';

const UPDATE_INTERVAL_MS = 15_000; // 15초마다 위치 전송

/**
 * 이송 중인 요청의 위치를 주기적으로 Supabase에 업데이트.
 * 병원 대시보드에서 구급차 접근을 실시간으로 확인할 수 있다.
 */
export function useLocationSharing(
  requestId: string | null,
  position: GeoPosition | null,
  active: boolean,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || !requestId || !position || !supabase) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateLocation = async () => {
      if (!position) return;
      await supabase
        .from('requests')
        .update({
          latitude: position.latitude,
          longitude: position.longitude,
        })
        .eq('id', requestId);
    };

    // 즉시 1회 + 주기적 업데이트
    updateLocation();
    intervalRef.current = setInterval(updateLocation, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, requestId, position]);
}
