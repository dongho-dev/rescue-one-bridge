import type { Request, RequestStatus, RequestPriority } from '@/types/database';

const NAMES = ['김철수', '이영희', '박민수', '정수진', '최동호'];
const SYMPTOMS = ['흉통', '호흡곤란', '외상', '복통', '의식저하', '심정지'];
const STATUSES: RequestStatus[] = ['pending', 'matched', 'en_route', 'completed'];
const PRIORITIES: RequestPriority[] = ['emergency', 'urgent', 'normal'];

export function generateDemoRequests(): Request[] {
  return Array.from({ length: 6 }, (_, i) => {
    const status = STATUSES[Math.min(i, STATUSES.length - 1)];
    const severity = Math.max(1, 5 - i);
    const distanceKm = Math.round((Math.random() * 8 + 1) * 10) / 10;
    const now = Date.now();

    return {
      id: crypto.randomUUID(),
      hospital_id: status !== 'pending' ? 'demo-hospital' : null,
      paramedic_id: 'demo-user',
      status,
      priority: PRIORITIES[Math.min(i, 2)],
      severity,
      symptom: SYMPTOMS[i % SYMPTOMS.length],
      patient_name: NAMES[i % NAMES.length],
      patient_age: 20 + i * 10,
      patient_gender: i % 2 === 0 ? '남성' : '여성',
      allergies: i === 0 ? ['페니실린'] : [],
      vitals: {
        heart_rate: 70 + i * 5,
        blood_pressure: `${120 + i * 5}/${80 + i * 3}`,
        temperature: 36.5 + i * 0.2,
      },
      distance_km: status !== 'pending' ? distanceKm : null,
      eta_minutes: status !== 'pending' ? Math.max(5, Math.round(distanceKm * 3)) : null,
      location_text: '서울시 강남구',
      latitude: 37.4979 + (Math.random() - 0.5) * 0.02,
      longitude: 127.0276 + (Math.random() - 0.5) * 0.02,
      notes: i === 0 ? '현장 도착 시 의식 없음' : null,
      requested_at: new Date(now - i * 15 * 60000).toISOString(),
      matched_at: status !== 'pending' ? new Date(now - i * 14 * 60000).toISOString() : null,
      completed_at: status === 'completed' ? new Date(now - i * 5 * 60000).toISOString() : null,
      created_at: new Date(now - i * 15 * 60000).toISOString(),
      updated_at: new Date(now - i * 10 * 60000).toISOString(),
    };
  });
}
