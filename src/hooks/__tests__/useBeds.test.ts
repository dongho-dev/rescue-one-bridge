import { describe, it, expect } from 'vitest';
import { mockBeds } from '../../mocks/bedData';

/**
 * Tests for useBeds hook data contracts.
 * Verifies mock data structure that the hook returns in demo/fallback mode.
 */

describe('useBeds mock data', () => {
  it('has beds with required fields', () => {
    expect(mockBeds.length).toBeGreaterThan(0);
    for (const bed of mockBeds) {
      expect(bed.id).toBeTruthy();
      expect(bed.section).toBeTruthy();
      expect(bed.number).toBeTruthy();
      expect(bed.status).toBeTruthy();
    }
  });

  it('has valid bed status values', () => {
    const validStatuses = ['occupied', 'available', 'maintenance', 'cleaning'];
    for (const bed of mockBeds) {
      expect(validStatuses).toContain(bed.status);
    }
  });

  it('bed IDs follow section-number format', () => {
    for (const bed of mockBeds) {
      expect(bed.id).toContain('-');
      const parts = bed.id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    }
  });
});
