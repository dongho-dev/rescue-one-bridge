import { describe, it, expect } from 'vitest';
import {
  getSeverityColor,
  getSeverityText,
  getPatientStatusColor,
  getPatientStatusText,
  getBedStatusColor,
  getBedStatusText,
  getRoleColor,
  getRoleText,
  getStaffStatusColor,
  getStaffStatusText,
  getEquipmentStatusColor,
  getEquipmentStatusText,
  getEquipmentTypeText,
} from '../statusHelpers';

// -- Severity --

describe('getSeverityColor', () => {
  it('returns destructive for critical', () => {
    expect(getSeverityColor('critical')).toBe('destructive');
  });
  it('returns secondary for urgent', () => {
    expect(getSeverityColor('urgent')).toBe('secondary');
  });
  it('returns outline for stable', () => {
    expect(getSeverityColor('stable')).toBe('outline');
  });
  it('returns outline for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getSeverityColor('unknown' as any)).toBe('outline');
  });
});

describe('getSeverityText', () => {
  it('returns 위급 for critical', () => {
    expect(getSeverityText('critical')).toBe('위급');
  });
  it('returns 응급 for urgent', () => {
    expect(getSeverityText('urgent')).toBe('응급');
  });
  it('returns 안정 for stable', () => {
    expect(getSeverityText('stable')).toBe('안정');
  });
  it('returns 미분류 for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getSeverityText('unknown' as any)).toBe('미분류');
  });
});

// -- Patient Status --

describe('getPatientStatusColor', () => {
  it('returns default for treating', () => {
    expect(getPatientStatusColor('treating')).toBe('default');
  });
  it('returns secondary for waiting', () => {
    expect(getPatientStatusColor('waiting')).toBe('secondary');
  });
  it('returns outline for stable', () => {
    expect(getPatientStatusColor('stable')).toBe('outline');
  });
  it('returns outline for discharged', () => {
    expect(getPatientStatusColor('discharged')).toBe('outline');
  });
  it('returns outline for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getPatientStatusColor('unknown' as any)).toBe('outline');
  });
});

describe('getPatientStatusText', () => {
  it('returns 대기중 for waiting', () => {
    expect(getPatientStatusText('waiting')).toBe('대기중');
  });
  it('returns 치료중 for treating', () => {
    expect(getPatientStatusText('treating')).toBe('치료중');
  });
  it('returns 안정 for stable', () => {
    expect(getPatientStatusText('stable')).toBe('안정');
  });
  it('returns 퇴원 for discharged', () => {
    expect(getPatientStatusText('discharged')).toBe('퇴원');
  });
  it('returns raw status for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getPatientStatusText('unknown' as any)).toBe('unknown');
  });
});

// -- Bed Status --

describe('getBedStatusColor', () => {
  it('returns destructive for occupied', () => {
    expect(getBedStatusColor('occupied')).toBe('destructive');
  });
  it('returns default for available', () => {
    expect(getBedStatusColor('available')).toBe('default');
  });
  it('returns secondary for maintenance', () => {
    expect(getBedStatusColor('maintenance')).toBe('secondary');
  });
  it('returns outline for cleaning', () => {
    expect(getBedStatusColor('cleaning')).toBe('outline');
  });
  it('returns outline for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getBedStatusColor('unknown' as any)).toBe('outline');
  });
});

describe('getBedStatusText', () => {
  it('returns 사용중 for occupied', () => {
    expect(getBedStatusText('occupied')).toBe('사용중');
  });
  it('returns 사용가능 for available', () => {
    expect(getBedStatusText('available')).toBe('사용가능');
  });
  it('returns 점검중 for maintenance', () => {
    expect(getBedStatusText('maintenance')).toBe('점검중');
  });
  it('returns 청소중 for cleaning', () => {
    expect(getBedStatusText('cleaning')).toBe('청소중');
  });
  it('returns raw status for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getBedStatusText('unknown' as any)).toBe('unknown');
  });
});

// -- Staff Role --

describe('getRoleColor', () => {
  it('returns default for doctor', () => {
    expect(getRoleColor('doctor')).toBe('default');
  });
  it('returns secondary for nurse', () => {
    expect(getRoleColor('nurse')).toBe('secondary');
  });
  it('returns outline for technician', () => {
    expect(getRoleColor('technician')).toBe('outline');
  });
  it('returns destructive for admin', () => {
    expect(getRoleColor('admin')).toBe('destructive');
  });
  it('returns outline for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getRoleColor('unknown' as any)).toBe('outline');
  });
});

describe('getRoleText', () => {
  it('returns 의사 for doctor', () => {
    expect(getRoleText('doctor')).toBe('의사');
  });
  it('returns 간호사 for nurse', () => {
    expect(getRoleText('nurse')).toBe('간호사');
  });
  it('returns 기사 for technician', () => {
    expect(getRoleText('technician')).toBe('기사');
  });
  it('returns 관리자 for admin', () => {
    expect(getRoleText('admin')).toBe('관리자');
  });
  it('returns raw role for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getRoleText('unknown' as any)).toBe('unknown');
  });
});

// -- Staff Status --

describe('getStaffStatusColor', () => {
  it('returns default for on_duty', () => {
    expect(getStaffStatusColor('on_duty')).toBe('default');
  });
  it('returns secondary for off_duty', () => {
    expect(getStaffStatusColor('off_duty')).toBe('secondary');
  });
  it('returns outline for break', () => {
    expect(getStaffStatusColor('break')).toBe('outline');
  });
  it('returns destructive for emergency', () => {
    expect(getStaffStatusColor('emergency')).toBe('destructive');
  });
  it('returns outline for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getStaffStatusColor('unknown' as any)).toBe('outline');
  });
});

describe('getStaffStatusText', () => {
  it('returns 근무중 for on_duty', () => {
    expect(getStaffStatusText('on_duty')).toBe('근무중');
  });
  it('returns 비번 for off_duty', () => {
    expect(getStaffStatusText('off_duty')).toBe('비번');
  });
  it('returns 휴식중 for break', () => {
    expect(getStaffStatusText('break')).toBe('휴식중');
  });
  it('returns 응급호출 for emergency', () => {
    expect(getStaffStatusText('emergency')).toBe('응급호출');
  });
  it('returns raw status for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getStaffStatusText('unknown' as any)).toBe('unknown');
  });
});

// -- Equipment Status --

describe('getEquipmentStatusColor', () => {
  it('returns default for operational', () => {
    expect(getEquipmentStatusColor('operational')).toBe('default');
  });
  it('returns secondary for maintenance', () => {
    expect(getEquipmentStatusColor('maintenance')).toBe('secondary');
  });
  it('returns destructive for error', () => {
    expect(getEquipmentStatusColor('error')).toBe('destructive');
  });
  it('returns outline for offline', () => {
    expect(getEquipmentStatusColor('offline')).toBe('outline');
  });
  it('returns outline for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getEquipmentStatusColor('unknown' as any)).toBe('outline');
  });
});

describe('getEquipmentStatusText', () => {
  it('returns 정상 for operational', () => {
    expect(getEquipmentStatusText('operational')).toBe('정상');
  });
  it('returns 점검중 for maintenance', () => {
    expect(getEquipmentStatusText('maintenance')).toBe('점검중');
  });
  it('returns 오류 for error', () => {
    expect(getEquipmentStatusText('error')).toBe('오류');
  });
  it('returns 오프라인 for offline', () => {
    expect(getEquipmentStatusText('offline')).toBe('오프라인');
  });
  it('returns raw status for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getEquipmentStatusText('unknown' as any)).toBe('unknown');
  });
});

// -- Equipment Type --

describe('getEquipmentTypeText', () => {
  it('returns 환자 모니터 for monitor', () => {
    expect(getEquipmentTypeText('monitor')).toBe('환자 모니터');
  });
  it('returns 인공호흡기 for ventilator', () => {
    expect(getEquipmentTypeText('ventilator')).toBe('인공호흡기');
  });
  it('returns 제세동기 for defibrillator', () => {
    expect(getEquipmentTypeText('defibrillator')).toBe('제세동기');
  });
  it('returns X-ray for xray', () => {
    expect(getEquipmentTypeText('xray')).toBe('X-ray');
  });
  it('returns 초음파 for ultrasound', () => {
    expect(getEquipmentTypeText('ultrasound')).toBe('초음파');
  });
  it('returns 수액 주입기 for infusion', () => {
    expect(getEquipmentTypeText('infusion')).toBe('수액 주입기');
  });
  it('returns 기타 for other', () => {
    expect(getEquipmentTypeText('other')).toBe('기타');
  });
  it('returns 기타 for unknown value', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getEquipmentTypeText('unknown' as any)).toBe('기타');
  });
});
