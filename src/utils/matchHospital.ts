import { calculateDistanceKm } from '@/hooks/useGeolocation';
import type { MockHospital } from '@/components/common/models';

export interface MatchResult {
  matched: boolean;
  hospital?: MockHospital;
  distance_km?: number;
  score?: number;
  reason?: string;
}

/**
 * 클라이언트 사이드 병원 매칭 (데모모드 / 오프라인용)
 *
 * 점수 = 거리(40%) + 병상(30%) + 대기(20%) + 수용(10%)
 */
export function matchHospitalClient(
  hospitals: MockHospital[],
  ambulanceLat?: number | null,
  ambulanceLng?: number | null,
): MatchResult {
  const candidates = hospitals.filter(h => h.accepting && h.available_beds > 0);

  if (candidates.length === 0) {
    return { matched: false, reason: '수용 가능한 병원이 없습니다.' };
  }

  const scored = candidates.map(h => {
    let distScore = 0;
    let distKm: number | null = null;

    if (ambulanceLat != null && ambulanceLng != null && h.latitude != null && h.longitude != null) {
      distKm = calculateDistanceKm(ambulanceLat, ambulanceLng, h.latitude, h.longitude);
      distScore = Math.max(0, 40 - distKm * 4);
    }

    const bedScore = Math.min(30, h.available_beds * 10);
    const queueScore = Math.max(0, 20 - h.queue * 2);
    const acceptScore = h.accepting ? 10 : 0;
    const score = distScore + bedScore + queueScore + acceptScore;

    return { hospital: h, score, distance_km: distKm };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    matched: true,
    hospital: best.hospital,
    distance_km: best.distance_km ?? undefined,
    score: Math.round(best.score * 10) / 10,
  };
}
