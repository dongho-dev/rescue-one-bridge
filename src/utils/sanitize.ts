/**
 * Sanitize phone number for use in tel: URLs.
 * Strips everything except digits, +, -, and spaces.
 */
export function sanitizePhone(raw: string): string {
  return raw.replace(/[^\d+\-\s]/g, '');
}

/**
 * Validate latitude/longitude ranges.
 * lat must be in [-90, 90], lng in [-180, 180], and both must be finite numbers.
 */
export function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
