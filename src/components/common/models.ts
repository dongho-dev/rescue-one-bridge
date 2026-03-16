export interface MockRequest {
  id: string;
  time: Date;
  severity: number; // 1(경미) ~ 5(중증)
  distanceKm: number;
  symptom: string;
  status: 'pending' | 'matched' | 'enRoute' | 'completed';
  patientAge?: string;
  allergies?: string[];
  eta?: number; // minutes
}

export interface MockHospital {
  id: string;
  name: string;
  accepting: boolean;
  queue: number; // ER 대기열
  beds: number; // 가용 병상 수
  specialties: string[];
  distanceKm: number | null; // null when geolocation is unavailable
  contact?: string;
  avgWaitTime?: number; // minutes
}

// 목 데이터 생성
export const generateMockRequests = (): MockRequest[] => {
  const symptoms = ['흉통', '호흡곤란', '외상', '복통', '두통', '발열', '의식잃음', '심정지'];
  const statuses: Array<'pending' | 'matched' | 'enRoute' | 'completed'> = ['pending', 'matched', 'enRoute', 'completed'];
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: `RQ-${String(1001 + i).padStart(4, '0')}`,
    time: new Date(Date.now() - Math.random() * 3600000), // 최근 1시간 내
    severity: Math.floor(Math.random() * 5) + 1,
    distanceKm: Math.round((Math.random() * 12 + 0.3) * 10) / 10,
    symptom: symptoms[Math.floor(Math.random() * symptoms.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    patientAge: `${Math.floor(Math.random() * 60 + 20)}세`,
    allergies: Math.random() > 0.7 ? ['페니실린'] : undefined,
    eta: Math.floor(Math.random() * 30 + 5)
  }));
};

export const generateMockHospitals = (): MockHospital[] => {
  const hospitalNames = [
    '서울대학교병원 응급의료센터',
    '연세세브란스병원 응급실',
    '삼성서울병원 응급센터',
    '아산병원 응급의료센터',
    '고대안암병원 응급실',
    '한양대병원 응급센터'
  ];
  
  const specialties = ['심장내과', '신경외과', '외상외과', '소아과', '정형외과'];
  
  const fixedDistances = [2.3, 4.1, 1.8, 6.5, 3.2, 5.7];
  const fixedQueues = [3, 7, 2, 10, 5, 8];
  const fixedBeds = [4, 1, 3, 0, 2, 1];
  const fixedAccepting = [true, true, true, false, true, true];
  const fixedWaitTimes = [25, 40, 15, 55, 30, 45];

  return hospitalNames.map((name, i) => ({
    id: `H-${String(i + 1).padStart(3, '0')}`,
    name,
    accepting: fixedAccepting[i],
    queue: fixedQueues[i],
    beds: fixedBeds[i],
    specialties: specialties.slice(0, (i % 3) + 1),
    distanceKm: fixedDistances[i],
    contact: `02-${2000 + i * 111}-${3000 + i * 222}`,
    avgWaitTime: fixedWaitTimes[i],
  }));
};