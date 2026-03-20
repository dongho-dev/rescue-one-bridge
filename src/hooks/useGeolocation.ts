import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
  tracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

// 서울 강남구 기본 좌표 (GPS 실패 시 폴백)
const FALLBACK_POSITION: GeoPosition = { latitude: 37.4979, longitude: 127.0276 };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // ---------- shared handlers ----------
  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    console.warn('Geolocation error:', err.message);
    setError(err.message);
    setPosition(FALLBACK_POSITION);
    setLoading(false);
  }, []);

  // ---------- one-time refresh ----------
  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation을 지원하지 않는 브라우저입니다.');
      setPosition(FALLBACK_POSITION);
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, GEO_OPTIONS);
  }, [handleSuccess, handleError]);

  // ---------- continuous tracking ----------
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation을 지원하지 않는 브라우저입니다.');
      setPosition(FALLBACK_POSITION);
      setLoading(false);
      return;
    }

    // avoid duplicate watchers
    if (watchIdRef.current !== null) return;

    setLoading(true);
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, GEO_OPTIONS);
    watchIdRef.current = id;
    setTracking(true);
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  // ---------- initial one-time fetch ----------
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---------- cleanup watcher on unmount ----------
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { position, error, loading, refresh, tracking, startTracking, stopTracking };
}

/**
 * Haversine formula: 두 GPS 좌표 간 거리(km) 계산
 */
export function calculateDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
