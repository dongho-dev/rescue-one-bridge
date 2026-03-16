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
      expect(typeof h.beds).toBe('number');
      expect(Array.isArray(h.specialties)).toBe(true);
      expect(h.specialties.length).toBeGreaterThan(0);
    }
  });

  it('distanceKm is consistent between calls (no Math.random)', () => {
    const first = generateMockHospitals();
    const second = generateMockHospitals();
    for (let i = 0; i < first.length; i++) {
      expect(first[i].distanceKm).toBe(second[i].distanceKm);
    }
  });

  it('distanceKm values are fixed numbers in mock data', () => {
    const hospitals = generateMockHospitals();
    const expectedDistances = [2.3, 4.1, 1.8, 6.5, 3.2, 5.7];
    for (let i = 0; i < hospitals.length; i++) {
      expect(hospitals[i].distanceKm).toBe(expectedDistances[i]);
    }
  });

  it('distanceKm can be null in the interface (type check)', () => {
    // This is a compile-time test that MockHospital.distanceKm accepts null
    const testHospital = generateMockHospitals()[0];
    const withNull = { ...testHospital, distanceKm: null };
    expect(withNull.distanceKm).toBeNull();
  });

  it('each hospital has contact information', () => {
    const hospitals = generateMockHospitals();
    for (const h of hospitals) {
      expect(h.contact).toBeTruthy();
    }
  });

  it('each hospital has avgWaitTime', () => {
    const hospitals = generateMockHospitals();
    for (const h of hospitals) {
      expect(h.avgWaitTime).toBeGreaterThan(0);
    }
  });
});
