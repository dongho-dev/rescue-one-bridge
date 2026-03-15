export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  severity: 'critical' | 'urgent' | 'stable';
  admissionTime: string;
  bed: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
  status: 'waiting' | 'treating' | 'stable' | 'discharged';
}

export const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: '김민수',
    age: 45,
    gender: '남성',
    diagnosis: '급성 심근경색',
    severity: 'critical',
    admissionTime: '14:25',
    bed: 'A-01',
    vitals: {
      heartRate: 95,
      bloodPressure: '140/90',
      temperature: 37.2,
      oxygenSaturation: 98
    },
    status: 'treating'
  },
  {
    id: 'P002',
    name: '이영희',
    age: 32,
    gender: '여성',
    diagnosis: '골절 의심',
    severity: 'urgent',
    admissionTime: '13:45',
    bed: 'B-03',
    vitals: {
      heartRate: 82,
      bloodPressure: '120/80',
      temperature: 36.8,
      oxygenSaturation: 99
    },
    status: 'waiting'
  },
  {
    id: 'P003',
    name: '박철수',
    age: 67,
    gender: '남성',
    diagnosis: '호흡곤란',
    severity: 'urgent',
    admissionTime: '12:30',
    bed: 'A-02',
    vitals: {
      heartRate: 105,
      bloodPressure: '160/95',
      temperature: 38.1,
      oxygenSaturation: 92
    },
    status: 'treating'
  },
  {
    id: 'P004',
    name: '최미영',
    age: 28,
    gender: '여성',
    diagnosis: '두통 및 어지러움',
    severity: 'stable',
    admissionTime: '11:15',
    bed: 'C-01',
    vitals: {
      heartRate: 75,
      bloodPressure: '115/75',
      temperature: 36.5,
      oxygenSaturation: 100
    },
    status: 'stable'
  }
];
