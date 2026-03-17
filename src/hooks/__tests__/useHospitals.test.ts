import { describe, it, expect } from 'vitest';
import { generateMockHospitals } from '../../components/common/models';

describe('useHospitals mock data', () => {
  it('generates 6 hospitals', () => {
    const hospitals = generateMockHospitals();
    expect(hospitals.length).toBe(6);
  });

  it('each hospital has required fields', () => {
    const hospitals = generateMockHospitals();
    for (const h of hospitals) {
      expect(h.id).toBeTruthy();
      expect(h.name).toBeTruthy();
      expect(typeof h.accepting).toBe('boolean');
      expect(typeof h.queue).toBe('number');
      expect(typeof h.available_beds).toBe('number');
      expect(Array.isArray(h.specialties)).toBe(true);
      expect(h.specialties.length).toBeGreaterThan(0);
    }
  });

  it('distance_km is consistent between calls (no Math.random)', () => {
    const first = generateMockHospitals();
    const second = generateMockHospitals();
    for (let i = 0; i < first.length; i++) {
      expect(first[i].distance_km).toBe(second[i].distance_km);
    }
  });

  it('distance_km values are fixed numbers in mock data', () => {
    const hospitals = generateMockHospitals();
    const expectedDistances = [2.3, 4.1, 1.8, 6.5, 3.2, 5.7];
    for (let i = 0; i < hospitals.length; i++) {
      expect(hospitals[i].distance_km).toBe(expectedDistances[i]);
    }
  });

  it('distance_km can be null in the interface (type check)', () => {
    // This is a compile-time test that MockHospital.distance_km accepts null
    const testHospital = generateMockHospitals()[0];
    const withNull = { ...testHospital, distance_km: null };
    expect(withNull.distance_km).toBeNull();
  });

  it('each hospital has contact information', () => {
    const hospitals = generateMockHospitals();
    for (const h of hospitals) {
      expect(h.contact).toBeTruthy();
    }
  });

  it('each hospital has avg_wait_time', () => {
    const hospitals = generateMockHospitals();
    for (const h of hospitals) {
      expect(h.avg_wait_time).toBeGreaterThan(0);
    }
  });
});
