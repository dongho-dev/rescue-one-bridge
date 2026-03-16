import { describe, it, expect } from 'vitest';
import { mockPatients } from '../../mocks/patientData';

/**
 * Tests for usePatients data mapping.
 * Verifies that the mock data contract is correct and that
 * the vitals JSONB key mapping expectations are documented.
 */

describe('usePatients mock data', () => {
  it('mock patients have valid vitals with camelCase keys', () => {
    for (const patient of mockPatients) {
      expect(patient.vitals).toHaveProperty('heartRate');
      expect(patient.vitals).toHaveProperty('bloodPressure');
      expect(patient.vitals).toHaveProperty('temperature');
      expect(patient.vitals).toHaveProperty('oxygenSaturation');
    }
  });

  it('vitals values are within expected ranges', () => {
    for (const patient of mockPatients) {
      expect(patient.vitals.heartRate).toBeGreaterThan(0);
      expect(patient.vitals.heartRate).toBeLessThan(300);
      expect(patient.vitals.temperature).toBeGreaterThan(30);
      expect(patient.vitals.temperature).toBeLessThan(45);
      expect(patient.vitals.oxygenSaturation).toBeGreaterThanOrEqual(0);
      expect(patient.vitals.oxygenSaturation).toBeLessThanOrEqual(100);
    }
  });

  it('all patients have required fields', () => {
    for (const patient of mockPatients) {
      expect(patient.id).toBeTruthy();
      expect(patient.name).toBeTruthy();
      expect(patient.age).toBeGreaterThan(0);
      expect(['critical', 'urgent', 'stable']).toContain(patient.severity);
      expect(['treating', 'waiting', 'stable', 'discharged']).toContain(patient.status);
    }
  });
});

describe('usePatients vitals DB key mapping', () => {
  // This test documents the expected DB -> frontend key mapping
  // that was fixed in issue #39
  it('DB uses snake_case keys for vitals', () => {
    // These are the keys used in the DB (from seed data)
    const dbVitals = {
      heart_rate: 95,
      blood_pressure: '140/90',
      temperature: 37.2,
      oxygen_saturation: 98,
    };

    // Frontend maps to camelCase
    const frontendVitals = {
      heartRate: dbVitals.heart_rate,
      bloodPressure: dbVitals.blood_pressure,
      temperature: dbVitals.temperature,
      oxygenSaturation: dbVitals.oxygen_saturation,
    };

    expect(frontendVitals.heartRate).toBe(95);
    expect(frontendVitals.bloodPressure).toBe('140/90');
    expect(frontendVitals.temperature).toBe(37.2);
    expect(frontendVitals.oxygenSaturation).toBe(98);
  });

  it('documents that camelCase keys from DB would return undefined', () => {
    // Before the fix, the code used camelCase keys to read from DB JSONB
    const dbVitals: Record<string, unknown> = {
      heart_rate: 95,
      blood_pressure: '140/90',
      temperature: 37.2,
      oxygen_saturation: 98,
    };

    // camelCase keys don't exist in DB data
    expect(dbVitals.heartRate).toBeUndefined();
    expect(dbVitals.bloodPressure).toBeUndefined();
    expect(dbVitals.oxygenSaturation).toBeUndefined();

    // snake_case keys do exist
    expect(dbVitals.heart_rate).toBe(95);
    expect(dbVitals.blood_pressure).toBe('140/90');
    expect(dbVitals.oxygen_saturation).toBe(98);

    // temperature is the same in both conventions
    expect(dbVitals.temperature).toBe(37.2);
  });
});
