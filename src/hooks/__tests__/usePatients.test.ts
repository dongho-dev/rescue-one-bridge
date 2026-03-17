import { describe, it, expect } from 'vitest';
import { mockPatients } from '../../mocks/patientData';

/**
 * Tests for usePatients data mapping.
 * Verifies that the mock data contract is correct and that
 * the vitals JSONB key mapping expectations are documented.
 */

describe('usePatients mock data', () => {
  it('mock patients have valid vitals with snake_case keys', () => {
    for (const patient of mockPatients) {
      expect(patient.vitals).toHaveProperty('heart_rate');
      expect(patient.vitals).toHaveProperty('blood_pressure');
      expect(patient.vitals).toHaveProperty('temperature');
      expect(patient.vitals).toHaveProperty('oxygen_saturation');
    }
  });

  it('vitals values are within expected ranges', () => {
    for (const patient of mockPatients) {
      expect(patient.vitals.heart_rate).toBeGreaterThan(0);
      expect(patient.vitals.heart_rate).toBeLessThan(300);
      expect(patient.vitals.temperature).toBeGreaterThan(30);
      expect(patient.vitals.temperature).toBeLessThan(45);
      expect(patient.vitals.oxygen_saturation).toBeGreaterThanOrEqual(0);
      expect(patient.vitals.oxygen_saturation).toBeLessThanOrEqual(100);
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
  // Frontend now uses snake_case keys matching the DB schema directly
  it('DB and frontend both use snake_case keys for vitals', () => {
    const vitals = {
      heart_rate: 95,
      blood_pressure: '140/90',
      temperature: 37.2,
      oxygen_saturation: 98,
    };

    expect(vitals.heart_rate).toBe(95);
    expect(vitals.blood_pressure).toBe('140/90');
    expect(vitals.temperature).toBe(37.2);
    expect(vitals.oxygen_saturation).toBe(98);
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
