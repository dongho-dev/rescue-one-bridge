import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { GeoPosition } from './useGeolocation';

const UPDATE_INTERVAL_MS = 15_000; // 15초마다 위치 전송
const MAX_CONSECUTIVE_ERRORS = 3;

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
  const positionRef = useRef<GeoPosition | null>(null);
  const errorCountRef = useRef(0);

  // position을 ref로 추적하여 interval 재설정 방지
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!active || !requestId || !supabase) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateLocation = async () => {
      const pos = positionRef.current;
      if (!pos) return;

      try {
        const { error } = await supabase
          .from('requests')
          .update({
            latitude: pos.latitude,
            longitude: pos.longitude,
          })
          .eq('id', requestId);

        if (error) {
          errorCountRef.current++;
          console.warn('[location] update failed:', error.message);
        } else {
          errorCountRef.current = 0;
        }

        if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          toast.error('위치 정보 전송에 실패하고 있습니다. 네트워크를 확인해주세요.');
          errorCountRef.current = 0;
        }
      } catch (err) {
        errorCountRef.current++;
        console.error('[location] network error:', err);

        if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          toast.error('위치 정보 전송에 실패하고 있습니다. 네트워크를 확인해주세요.');
          errorCountRef.current = 0;
        }
      }
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
  }, [active, requestId]);
}
