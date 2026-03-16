export interface BedInfo {
  id: string;
  section: string;
  number: string;
  status: 'occupied' | 'available' | 'maintenance' | 'cleaning';
  patient?: {
    name: string;
    id: string;
    admissionTime: string;
    diagnosis: string;
  };
  equipment: string[];
  lastCleaned: string;
  notes?: string;
  _supabaseId?: string;  // Supabase에서 fetch한 경우에만 존재
}

export const mockBeds: BedInfo[] = [
  {
    id: 'A-01',
    section: 'A',
    number: '01',
    status: 'occupied',
    patient: {
      name: '김민수',
      id: 'P001',
      admissionTime: '14:25',
      diagnosis: '급성 심근경색'
    },
    equipment: ['심전도', '산소공급', '링거'],
    lastCleaned: '13:30',
    notes: '중환자, 지속적인 모니터링 필요'
  },
  {
    id: 'A-02',
    section: 'A',
    number: '02',
    status: 'occupied',
    patient: {
      name: '박철수',
      id: 'P003',
      admissionTime: '12:30',
      diagnosis: '호흡곤란'
    },
    equipment: ['산소공급', '호흡기'],
    lastCleaned: '12:00',
  },
  {
    id: 'A-03',
    section: 'A',
    number: '03',
    status: 'available',
    equipment: ['기본'],
    lastCleaned: '15:00',
  },
  {
    id: 'B-01',
    section: 'B',
    number: '01',
    status: 'maintenance',
    equipment: ['기본'],
    lastCleaned: '10:00',
    notes: '전기 시설 점검 중'
  },
  {
    id: 'B-02',
    section: 'B',
    number: '02',
    status: 'cleaning',
    equipment: ['기본'],
    lastCleaned: '진행중',
  },
  {
    id: 'B-03',
    section: 'B',
    number: '03',
    status: 'occupied',
    patient: {
      name: '이영희',
      id: 'P002',
      admissionTime: '13:45',
      diagnosis: '골절 의심'
    },
    equipment: ['X-ray 호환'],
    lastCleaned: '13:15',
  },
  {
    id: 'C-01',
    section: 'C',
    number: '01',
    status: 'occupied',
    patient: {
      name: '최미영',
      id: 'P004',
      admissionTime: '11:15',
      diagnosis: '두통 및 어지러움'
    },
    equipment: ['기본'],
    lastCleaned: '11:00',
  },
  {
    id: 'C-02',
    section: 'C',
    number: '02',
    status: 'available',
    equipment: ['기본'],
    lastCleaned: '14:30',
  }
];
