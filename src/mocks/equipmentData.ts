export interface Equipment {
  id: string;
  name: string;
  type: 'monitor' | 'ventilator' | 'defibrillator' | 'xray' | 'ultrasound' | 'infusion' | 'other';
  model: string;
  manufacturer: string;
  status: 'operational' | 'maintenance' | 'error' | 'offline';
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  batteryLevel?: number;
  usageHours: number;
  alerts: string[];
  assignedTo?: string;
  notes?: string;
}

export const mockEquipment: Equipment[] = [
  {
    id: 'EQ001',
    name: '환자 모니터 #1',
    type: 'monitor',
    model: 'PhilipsX40',
    manufacturer: 'Philips',
    status: 'operational',
    location: '응급실 A-01',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    batteryLevel: 85,
    usageHours: 1250,
    alerts: [],
    assignedTo: '김민수 (P001)'
  },
  {
    id: 'EQ002',
    name: '인공호흡기 #1',
    type: 'ventilator',
    model: 'DrägerV500',
    manufacturer: 'Dräger',
    status: 'operational',
    location: '응급실 A-02',
    lastMaintenance: '2024-02-01',
    nextMaintenance: '2024-05-01',
    batteryLevel: 92,
    usageHours: 890,
    alerts: [],
    assignedTo: '박철수 (P003)'
  },
  {
    id: 'EQ003',
    name: '제세동기 #1',
    type: 'defibrillator',
    model: 'ZollR Plus',
    manufacturer: 'Zoll',
    status: 'maintenance',
    location: '정비실',
    lastMaintenance: '2024-02-20',
    nextMaintenance: '2024-03-20',
    batteryLevel: 100,
    usageHours: 450,
    alerts: ['정기 점검 중'],
    notes: '전극 패드 교체 예정'
  },
  {
    id: 'EQ004',
    name: 'X-ray 촬영기',
    type: 'xray',
    model: 'SiemensArios',
    manufacturer: 'Siemens',
    status: 'operational',
    location: '영상의학과',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-04-10',
    usageHours: 2150,
    alerts: []
  },
  {
    id: 'EQ005',
    name: '초음파 진단기',
    type: 'ultrasound',
    model: 'GELogiq',
    manufacturer: 'GE Healthcare',
    status: 'error',
    location: '응급실 B구역',
    lastMaintenance: '2024-01-25',
    nextMaintenance: '2024-04-25',
    usageHours: 1680,
    alerts: ['프로브 연결 오류', '긴급 수리 필요'],
    notes: '프로브 케이블 손상으로 인한 오류'
  },
  {
    id: 'EQ006',
    name: '수액 주입기 #1',
    type: 'infusion',
    model: 'B.BraunPerfusor',
    manufacturer: 'B.Braun',
    status: 'operational',
    location: '응급실 B-03',
    lastMaintenance: '2024-02-05',
    nextMaintenance: '2024-05-05',
    batteryLevel: 78,
    usageHours: 820,
    alerts: [],
    assignedTo: '이영희 (P002)'
  },
  {
    id: 'EQ007',
    name: '환자 모니터 #2',
    type: 'monitor',
    model: 'PhilipsX40',
    manufacturer: 'Philips',
    status: 'offline',
    location: '창고',
    lastMaintenance: '2024-01-20',
    nextMaintenance: '2024-04-20',
    batteryLevel: 0,
    usageHours: 2890,
    alerts: ['배터리 방전', '전원 공급 필요'],
    notes: '예비 장비로 보관 중'
  }
];
