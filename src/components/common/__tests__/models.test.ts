import { describe, it, expect } from 'vitest';
import { generateMockRequests, generateMockHospitals } from '../models';

describe('generateMockRequests', () => {
  it('should return an array of 12 requests', () => {
    const requests = generateMockRequests();
    expect(requests).toHaveLength(12);
  });

  it('each request should have all required fields', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req).toHaveProperty('id');
      expect(req).toHaveProperty('time');
      expect(req).toHaveProperty('severity');
      expect(req).toHaveProperty('distance_km');
      expect(req).toHaveProperty('symptom');
      expect(req).toHaveProperty('status');
    }
  });

  it('each request id should follow RQ-XXXX format', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req.id).toMatch(/^RQ-\d{4}$/);
    }
  });

  it('severity should be between 1 and 5', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req.severity).toBeGreaterThanOrEqual(1);
      expect(req.severity).toBeLessThanOrEqual(5);
    }
  });

  it('status should be one of the valid values', () => {
    const validStatuses = ['pending', 'matched', 'en_route', 'completed'];
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(validStatuses).toContain(req.status);
    }
  });

  it('time should be a Date instance', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req.time).toBeInstanceOf(Date);
    }
  });

  it('distance_km should be a positive number', () => {
    const requests = generateMockRequests();
    for (const req of requests) {
      expect(req.distance_km).toBeGreaterThan(0);
    }
  });
});

describe('generateMockHospitals', () => {
  it('should return an array of 6 hospitals', () => {
    const hospitals = generateMockHospitals();
    expect(hospitals).toHaveLength(6);
  });

  it('each hospital should have all required fields', () => {
    const hospitals = generateMockHospitals();
    for (const hospital of hospitals) {
      expect(hospital).toHaveProperty('id');
      expect(hospital).toHaveProperty('name');
      expect(hospital).toHaveProperty('accepting');
      expect(hospital).toHaveProperty('queue');
      expect(hospital).toHaveProperty('available_beds');
      expect(hospital).toHaveProperty('specialties');
      expect(hospital).toHaveProperty('distance_km');
    }
  });

  it('each hospital id should follow H-XXX format', () => {
    const hospitals = generateMockHospitals();
    for (const hospital of hospitals) {
      expect(hospital.id).toMatch(/^H-\d{3}$/);
    }
  });

  it('accepting should be a boolean', () => {
    const hospitals = generateMockHospitals();
    for (const hospital of hospitals) {
      expect(typeof hospital.accepting).toBe('boolean');
    }
  });

  it('specialties should be a non-empty array', () => {
    const hospitals = generateMockHospitals();
    for (const hospital of hospitals) {
      expect(Array.isArray(hospital.specialties)).toBe(true);
      expect(hospital.specialties.length).toBeGreaterThan(0);
    }
  });

  it('queue and available_beds should be non-negative integers', () => {
    const hospitals = generateMockHospitals();
    for (const hospital of hospitals) {
      expect(hospital.queue).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hospital.queue)).toBe(true);
      expect(hospital.available_beds).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hospital.available_beds)).toBe(true);
    }
  });

  it('distance_km should be a positive number', () => {
    const hospitals = generateMockHospitals();
    for (const hospital of hospitals) {
      expect(hospital.distance_km).toBeGreaterThan(0);
    }
  });
});
