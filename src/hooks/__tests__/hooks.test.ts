import { describe, it, expect } from 'vitest';
import { mockBeds } from '../../mocks/bedData';
import { mockPatients } from '../../mocks/patientData';
import { mockStaff } from '../../mocks/staffData';
import { mockEquipment } from '../../mocks/equipmentData';
import { generateMockRequests, generateMockHospitals } from '../../components/common/models';

/**
 * Since hooks rely on React context (useAuth) and Supabase,
 * we test the mock fallback data that hooks return in demo mode.
 * This verifies the data contracts that components depend on.
 */

describe('Mock data contracts (hook fallback data)', () => {
  describe('beds mock data', () => {
    it('should have required fields', () => {
      for (const bed of mockBeds) {
        expect(bed).toHaveProperty('id');
        expect(bed).toHaveProperty('section');
        expect(bed).toHaveProperty('number');
        expect(bed).toHaveProperty('status');
        expect(bed).toHaveProperty('equipment');
        expect(bed).toHaveProperty('lastCleaned');
      }
    });

    it('should have valid status values', () => {
      const validStatuses = ['occupied', 'available', 'maintenance', 'cleaning'];
      for (const bed of mockBeds) {
        expect(validStatuses).toContain(bed.status);
      }
    });

    it('occupied beds should have patient info', () => {
      const occupiedBeds = mockBeds.filter(b => b.status === 'occupied');
      expect(occupiedBeds.length).toBeGreaterThan(0);
      for (const bed of occupiedBeds) {
        expect(bed.patient).toBeDefined();
        expect(bed.patient!.name).toBeTruthy();
        expect(bed.patient!.id).toBeTruthy();
      }
    });
  });

  describe('patients mock data', () => {
    it('should have required fields', () => {
      for (const patient of mockPatients) {
        expect(patient).toHaveProperty('id');
        expect(patient).toHaveProperty('name');
        expect(patient).toHaveProperty('age');
        expect(patient).toHaveProperty('severity');
        expect(patient).toHaveProperty('vitals');
        expect(patient).toHaveProperty('status');
      }
    });

    it('should have valid vitals', () => {
      for (const patient of mockPatients) {
        expect(patient.vitals.heartRate).toBeGreaterThan(0);
        expect(patient.vitals.bloodPressure).toBeTruthy();
        expect(patient.vitals.temperature).toBeGreaterThan(0);
        expect(patient.vitals.oxygenSaturation).toBeGreaterThan(0);
        expect(patient.vitals.oxygenSaturation).toBeLessThanOrEqual(100);
      }
    });

    it('should have valid severity values', () => {
      const validSeverities = ['critical', 'urgent', 'stable'];
      for (const patient of mockPatients) {
        expect(validSeverities).toContain(patient.severity);
      }
    });
  });

  describe('staff mock data', () => {
    it('should have required fields', () => {
      for (const member of mockStaff) {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('role');
        expect(member).toHaveProperty('department');
        expect(member).toHaveProperty('status');
        expect(member).toHaveProperty('phone');
        expect(member).toHaveProperty('certifications');
      }
    });

    it('should have valid role values', () => {
      const validRoles = ['doctor', 'nurse', 'technician', 'admin'];
      for (const member of mockStaff) {
        expect(validRoles).toContain(member.role);
      }
    });

    it('should have valid status values', () => {
      const validStatuses = ['on-duty', 'off-duty', 'break', 'emergency'];
      for (const member of mockStaff) {
        expect(validStatuses).toContain(member.status);
      }
    });
  });

  describe('equipment mock data', () => {
    it('should have required fields', () => {
      for (const item of mockEquipment) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('location');
        expect(item).toHaveProperty('usageHours');
      }
    });

    it('should have valid status values', () => {
      const validStatuses = ['operational', 'maintenance', 'error', 'offline'];
      for (const item of mockEquipment) {
        expect(validStatuses).toContain(item.status);
      }
    });

    it('battery levels should be 0-100 when present', () => {
      for (const item of mockEquipment) {
        if (item.batteryLevel !== undefined) {
          expect(item.batteryLevel).toBeGreaterThanOrEqual(0);
          expect(item.batteryLevel).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe('requests generator', () => {
    it('should generate consistent structure', () => {
      const requests = generateMockRequests();
      expect(requests.length).toBe(12);
      for (const req of requests) {
        expect(req.severity).toBeGreaterThanOrEqual(1);
        expect(req.severity).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('hospitals generator', () => {
    it('should generate consistent structure', () => {
      const hospitals = generateMockHospitals();
      expect(hospitals.length).toBe(6);
      for (const h of hospitals) {
        expect(h.name).toBeTruthy();
        expect(typeof h.accepting).toBe('boolean');
        expect(h.specialties.length).toBeGreaterThan(0);
      }
    });

    it('should generate consistent distance values (no Math.random)', () => {
      const hospitals1 = generateMockHospitals();
      const hospitals2 = generateMockHospitals();
      for (let i = 0; i < hospitals1.length; i++) {
        expect(hospitals1[i].distanceKm).toBe(hospitals2[i].distanceKm);
        expect(hospitals1[i].beds).toBe(hospitals2[i].beds);
        expect(hospitals1[i].queue).toBe(hospitals2[i].queue);
      }
    });
  });
});
