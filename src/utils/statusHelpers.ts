import type {
  PatientSeverity,
  PatientStatus,
  BedStatus,
  StaffRole,
  StaffStatus,
  EquipmentStatus,
  EquipmentType,
} from '@/types/database';

export type BadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline';

// -- Severity (중증도) --

export const getSeverityColor = (severity: PatientSeverity): BadgeVariant => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'urgent': return 'secondary';
    case 'stable': return 'outline';
    default: return 'outline';
  }
};

export const getSeverityText = (severity: PatientSeverity): string => {
  switch (severity) {
    case 'critical': return '위급';
    case 'urgent': return '응급';
    case 'stable': return '안정';
    default: return '미분류';
  }
};

// -- Patient Status (환자 상태) --

export const getPatientStatusColor = (status: PatientStatus): BadgeVariant => {
  switch (status) {
    case 'treating': return 'default';
    case 'waiting': return 'secondary';
    case 'stable': return 'outline';
    case 'discharged': return 'outline';
    default: return 'outline';
  }
};

export const getPatientStatusText = (status: PatientStatus): string => {
  switch (status) {
    case 'waiting': return '대기중';
    case 'treating': return '치료중';
    case 'stable': return '안정';
    case 'discharged': return '퇴원';
    default: return status;
  }
};

// -- Bed Status (병상 상태) --

export const getBedStatusColor = (status: BedStatus): BadgeVariant => {
  switch (status) {
    case 'occupied': return 'destructive';
    case 'available': return 'default';
    case 'maintenance': return 'secondary';
    case 'cleaning': return 'outline';
    default: return 'outline';
  }
};

export const getBedStatusText = (status: BedStatus): string => {
  switch (status) {
    case 'occupied': return '사용중';
    case 'available': return '사용가능';
    case 'maintenance': return '점검중';
    case 'cleaning': return '청소중';
    default: return status;
  }
};

// -- Staff Role (직원 직종) --

export const getRoleColor = (role: StaffRole): BadgeVariant => {
  switch (role) {
    case 'doctor': return 'default';
    case 'nurse': return 'secondary';
    case 'technician': return 'outline';
    case 'admin': return 'destructive';
    default: return 'outline';
  }
};

export const getRoleText = (role: StaffRole): string => {
  switch (role) {
    case 'doctor': return '의사';
    case 'nurse': return '간호사';
    case 'technician': return '기사';
    case 'admin': return '관리자';
    default: return role;
  }
};

// -- Staff Status (직원 상태) --

export const getStaffStatusColor = (status: StaffStatus): BadgeVariant => {
  switch (status) {
    case 'on_duty': return 'default';
    case 'off_duty': return 'secondary';
    case 'break': return 'outline';
    case 'emergency': return 'destructive';
    default: return 'outline';
  }
};

export const getStaffStatusText = (status: StaffStatus): string => {
  switch (status) {
    case 'on_duty': return '근무중';
    case 'off_duty': return '비번';
    case 'break': return '휴식중';
    case 'emergency': return '응급호출';
    default: return status;
  }
};

// -- Equipment Status (장비 상태) --

export const getEquipmentStatusColor = (status: EquipmentStatus): BadgeVariant => {
  switch (status) {
    case 'operational': return 'default';
    case 'maintenance': return 'secondary';
    case 'error': return 'destructive';
    case 'offline': return 'outline';
    default: return 'outline';
  }
};

export const getEquipmentStatusText = (status: EquipmentStatus): string => {
  switch (status) {
    case 'operational': return '정상';
    case 'maintenance': return '점검중';
    case 'error': return '오류';
    case 'offline': return '오프라인';
    default: return status;
  }
};

// -- Equipment Type (장비 종류) --

export const getEquipmentTypeText = (type: EquipmentType): string => {
  switch (type) {
    case 'monitor': return '환자 모니터';
    case 'ventilator': return '인공호흡기';
    case 'defibrillator': return '제세동기';
    case 'xray': return 'X-ray';
    case 'ultrasound': return '초음파';
    case 'infusion': return '수액 주입기';
    case 'other': return '기타';
    default: return '기타';
  }
};
