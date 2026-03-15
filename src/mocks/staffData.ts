export interface StaffMember {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'technician' | 'admin';
  department: string;
  shift: 'day' | 'night' | 'evening';
  status: 'on-duty' | 'off-duty' | 'break' | 'emergency';
  phone: string;
  email: string;
  specialization?: string;
  yearsOfExperience: number;
  currentLocation: string;
  shiftStart: string;
  shiftEnd: string;
  certifications: string[];
  emergencyContact: string;
}

export const mockStaff: StaffMember[] = [
  {
    id: 'DOC001',
    name: '김의사',
    role: 'doctor',
    department: '응급의학과',
    shift: 'day',
    status: 'on-duty',
    phone: '010-0000-0001',
    email: 'staff1@example.com',
    specialization: '외상외과',
    yearsOfExperience: 8,
    currentLocation: '응급실 A구역',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['ACLS', 'ATLS', 'BLS'],
    emergencyContact: '010-0000-1001'
  },
  {
    id: 'DOC002',
    name: '이의사',
    role: 'doctor',
    department: '응급의학과',
    shift: 'night',
    status: 'off-duty',
    phone: '010-0000-0002',
    email: 'staff2@example.com',
    specialization: '내과',
    yearsOfExperience: 12,
    currentLocation: '대기실',
    shiftStart: '18:00',
    shiftEnd: '08:00',
    certifications: ['ACLS', 'BLS', 'PALS'],
    emergencyContact: '010-0000-1002'
  },
  {
    id: 'NUR001',
    name: '박간호사',
    role: 'nurse',
    department: '응급실',
    shift: 'day',
    status: 'on-duty',
    phone: '010-0000-0003',
    email: 'staff3@example.com',
    yearsOfExperience: 5,
    currentLocation: '응급실 B구역',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['BLS', 'ACLS'],
    emergencyContact: '010-0000-1003'
  },
  {
    id: 'NUR002',
    name: '최간호사',
    role: 'nurse',
    department: '응급실',
    shift: 'evening',
    status: 'break',
    phone: '010-0000-0004',
    email: 'staff4@example.com',
    yearsOfExperience: 3,
    currentLocation: '휴게실',
    shiftStart: '14:00',
    shiftEnd: '22:00',
    certifications: ['BLS'],
    emergencyContact: '010-0000-1004'
  },
  {
    id: 'TEC001',
    name: '정기사',
    role: 'technician',
    department: '방사선과',
    shift: 'day',
    status: 'on-duty',
    phone: '010-0000-0005',
    email: 'staff5@example.com',
    specialization: 'X-ray, CT',
    yearsOfExperience: 7,
    currentLocation: '영상의학과',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['방사선사', 'CT 전문'],
    emergencyContact: '010-0000-1005'
  },
  {
    id: 'ADM001',
    name: '송관리자',
    role: 'admin',
    department: '응급실 관리',
    shift: 'day',
    status: 'on-duty',
    phone: '010-0000-0006',
    email: 'staff6@example.com',
    yearsOfExperience: 10,
    currentLocation: '관리실',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['병원관리사'],
    emergencyContact: '010-0000-1006'
  }
];
