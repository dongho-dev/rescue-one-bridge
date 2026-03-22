import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

// PHI fields that must never be sent to Sentry
export const PHI_KEYS = new Set([
  'patient_name', 'patient_age', 'patient_gender',
  'vitals', 'allergies', 'symptom', 'notes',
  'diagnosis', 'location_text', 'latitude', 'longitude',
  'phone', 'email', 'emergency_contact', 'contact',
]);

const MAX_SCRUB_DEPTH = 5;

/**
 * Recursively scrub PHI keys from an object up to MAX_SCRUB_DEPTH.
 * Uses a seen set to prevent infinite loops on circular references.
 */
export function scrubDeep(
  obj: Record<string, unknown>,
  depth = 0,
  seen = new WeakSet<object>(),
): void {
  if (depth > MAX_SCRUB_DEPTH) return;
  if (seen.has(obj)) return;
  seen.add(obj);

  for (const key of Object.keys(obj)) {
    if (PHI_KEYS.has(key)) {
      obj[key] = '[REDACTED]';
    } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      scrubDeep(obj[key] as Record<string, unknown>, depth + 1, seen);
    }
  }
}

/**
 * Scrub PHI from event.request.data (may be JSON string or object).
 */
function scrubRequestData(event: Sentry.ErrorEvent): void {
  if (!event.request?.data) return;

  if (typeof event.request.data === 'string') {
    try {
      const parsed = JSON.parse(event.request.data) as Record<string, unknown>;
      scrubDeep(parsed);
      event.request.data = JSON.stringify(parsed);
    } catch {
      // If JSON parse fails, the entire body might contain PHI — redact it
      event.request.data = '[REDACTED]';
    }
  } else if (typeof event.request.data === 'object') {
    scrubDeep(event.request.data as Record<string, unknown>);
  }
}

/**
 * Scrub PHI from exception stacktrace frame local variables.
 */
function scrubExceptionVars(event: Sentry.ErrorEvent): void {
  if (!event.exception?.values) return;

  for (const value of event.exception.values) {
    if (!value.stacktrace?.frames) continue;
    for (const frame of value.stacktrace.frames) {
      if (frame.vars && typeof frame.vars === 'object') {
        scrubDeep(frame.vars as Record<string, unknown>);
      }
    }
  }
}

export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0, // Disable replay to prevent capturing form data
    beforeSend(event) {
      // Scrub PHI from extra data (recursive)
      if (event.extra) {
        scrubDeep(event.extra as Record<string, unknown>);
      }

      // Scrub PHI from breadcrumb data (recursive)
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          if (crumb.data) {
            scrubDeep(crumb.data as Record<string, unknown>);
          }
        }
      }

      // Scrub PHI from context (recursive)
      if (event.contexts) {
        for (const ctx of Object.values(event.contexts)) {
          if (ctx && typeof ctx === 'object') {
            scrubDeep(ctx as Record<string, unknown>);
          }
        }
      }

      // Scrub PHI from request body
      scrubRequestData(event);

      // Scrub PHI from exception stacktrace variables
      scrubExceptionVars(event);

      return event;
    },
  });
}

export { Sentry };
