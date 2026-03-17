import { describe, it, expect } from 'vitest';
import { mockEquipment } from '../../mocks/equipmentData';

/**
 * Tests for useEquipment hook data contracts.
 * Verifies mock data structure that the hook returns in demo/fallback mode.
 */

describe('useEquipment mock data', () => {
  it('has equipment with required fields', () => {
    expect(mockEquipment.length).toBeGreaterThan(0);
    for (const item of mockEquipment) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.type).toBeTruthy();
      expect(item.status).toBeTruthy();
      expect(item.location).toBeTruthy();
      expect(typeof item.usage_hours).toBe('number');
    }
  });

  it('has valid equipment status values', () => {
    const validStatuses = ['operational', 'maintenance', 'error', 'offline'];
    for (const item of mockEquipment) {
      expect(validStatuses).toContain(item.status);
    }
  });

  it('battery levels are 0-100 when present', () => {
    for (const item of mockEquipment) {
      if (item.battery_level != null) {
        expect(item.battery_level).toBeGreaterThanOrEqual(0);
        expect(item.battery_level).toBeLessThanOrEqual(100);
      }
    }
  });

  it('usage hours are non-negative', () => {
    for (const item of mockEquipment) {
      expect(item.usage_hours).toBeGreaterThanOrEqual(0);
    }
  });

  it('alerts is always an array', () => {
    for (const item of mockEquipment) {
      expect(Array.isArray(item.alerts)).toBe(true);
    }
  });
});
