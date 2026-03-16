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
  it('returns outline for unknown', () => {
    expect(getSeverityColor('unknown')).toBe('outline');
  });
});

describe('getSeverityText', () => {
  it('returns correct Korean text for each severity', () => {
    expect(getSeverityText('critical')).toBe('위급');
    expect(getSeverityText('urgent')).toBe('응급');
    expect(getSeverityText('stable')).toBe('안정');
    expect(getSeverityText('other')).toBe('미분류');
  });
});

describe('getPatientStatusColor', () => {
  it('returns correct variant for each status', () => {
    expect(getPatientStatusColor('treating')).toBe('default');
    expect(getPatientStatusColor('waiting')).toBe('secondary');
    expect(getPatientStatusColor('stable')).toBe('outline');
    expect(getPatientStatusColor('discharged')).toBe('outline');
  });
});

describe('getPatientStatusText', () => {
  it('returns correct Korean text', () => {
    expect(getPatientStatusText('waiting')).toBe('대기중');
    expect(getPatientStatusText('treating')).toBe('치료중');
    expect(getPatientStatusText('stable')).toBe('안정');
    expect(getPatientStatusText('discharged')).toBe('퇴원');
  });
  it('returns raw value for unknown status', () => {
    expect(getPatientStatusText('custom')).toBe('custom');
  });
});

describe('getBedStatusColor', () => {
  it('returns correct variant for each status', () => {
    expect(getBedStatusColor('occupied')).toBe('destructive');
    expect(getBedStatusColor('available')).toBe('default');
    expect(getBedStatusColor('maintenance')).toBe('secondary');
    expect(getBedStatusColor('cleaning')).toBe('outline');
  });
});

describe('getBedStatusText', () => {
  it('returns correct Korean text', () => {
    expect(getBedStatusText('occupied')).toBe('사용중');
    expect(getBedStatusText('available')).toBe('사용가능');
    expect(getBedStatusText('maintenance')).toBe('점검중');
    expect(getBedStatusText('cleaning')).toBe('청소중');
  });
});

describe('getRoleColor', () => {
  it('returns correct variant for each role', () => {
    expect(getRoleColor('doctor')).toBe('default');
    expect(getRoleColor('nurse')).toBe('secondary');
    expect(getRoleColor('technician')).toBe('outline');
    expect(getRoleColor('admin')).toBe('destructive');
  });
});

describe('getRoleText', () => {
  it('returns correct Korean text', () => {
    expect(getRoleText('doctor')).toBe('의사');
    expect(getRoleText('nurse')).toBe('간호사');
    expect(getRoleText('technician')).toBe('기사');
    expect(getRoleText('admin')).toBe('관리자');
  });
});

describe('getStaffStatusColor', () => {
  it('returns correct variant for each status', () => {
    expect(getStaffStatusColor('on-duty')).toBe('default');
    expect(getStaffStatusColor('off-duty')).toBe('secondary');
    expect(getStaffStatusColor('break')).toBe('outline');
    expect(getStaffStatusColor('emergency')).toBe('destructive');
  });
});

describe('getStaffStatusText', () => {
  it('returns correct Korean text', () => {
    expect(getStaffStatusText('on-duty')).toBe('근무중');
    expect(getStaffStatusText('off-duty')).toBe('비번');
    expect(getStaffStatusText('break')).toBe('휴식중');
    expect(getStaffStatusText('emergency')).toBe('응급호출');
  });
});

describe('getEquipmentStatusColor', () => {
  it('returns correct variant for each status', () => {
    expect(getEquipmentStatusColor('operational')).toBe('default');
    expect(getEquipmentStatusColor('maintenance')).toBe('secondary');
    expect(getEquipmentStatusColor('error')).toBe('destructive');
    expect(getEquipmentStatusColor('offline')).toBe('outline');
  });
});

describe('getEquipmentStatusText', () => {
  it('returns correct Korean text', () => {
    expect(getEquipmentStatusText('operational')).toBe('정상');
    expect(getEquipmentStatusText('maintenance')).toBe('점검중');
    expect(getEquipmentStatusText('error')).toBe('오류');
    expect(getEquipmentStatusText('offline')).toBe('오프라인');
  });
});

describe('getEquipmentTypeText', () => {
  it('returns correct Korean text for all types', () => {
    expect(getEquipmentTypeText('monitor')).toBe('환자 모니터');
    expect(getEquipmentTypeText('ventilator')).toBe('인공호흡기');
    expect(getEquipmentTypeText('defibrillator')).toBe('제세동기');
    expect(getEquipmentTypeText('xray')).toBe('X-ray');
    expect(getEquipmentTypeText('ultrasound')).toBe('초음파');
    expect(getEquipmentTypeText('infusion')).toBe('수액 주입기');
    expect(getEquipmentTypeText('other')).toBe('기타');
  });
});
