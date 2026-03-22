import { describe, it, expect } from 'vitest';
import { calculateDistanceKm } from '../useGeolocation';

describe('calculateDistanceKm', () => {
  it('returns approximately 325km for Seoul to Busan', () => {
    // Seoul: 37.5665, 126.9780
    // Busan: 35.1796, 129.0756
    const dist = calculateDistanceKm(37.5665, 126.978, 35.1796, 129.0756);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(350);
  });

  it('returns 0 for identical coordinates', () => {
    const dist = calculateDistanceKm(37.5665, 126.978, 37.5665, 126.978);
    expect(dist).toBe(0);
  });

  it('returns correct distance for opposite hemispheres', () => {
    // New York: 40.7128, -74.0060
    // Sydney: -33.8688, 151.2093
    const dist = calculateDistanceKm(40.7128, -74.006, -33.8688, 151.2093);
    expect(dist).toBeGreaterThan(15000);
    expect(dist).toBeLessThan(16500);
  });

  it('handles equator crossing', () => {
    // Quito, Ecuador: 0.1807, -78.4678
    // Lima, Peru: -12.0464, -77.0428
    const dist = calculateDistanceKm(0.1807, -78.4678, -12.0464, -77.0428);
    expect(dist).toBeGreaterThan(1300);
    expect(dist).toBeLessThan(1400);
  });

  it('returns small distance for nearby points', () => {
    // Two points about 1km apart in Seoul
    const dist = calculateDistanceKm(37.5665, 126.978, 37.5755, 126.978);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2);
  });
});
