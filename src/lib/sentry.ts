import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

// PHI fields that must never be sent to Sentry
const PHI_KEYS = new Set([
  'patient_name', 'patient_age', 'patient_gender',
  'vitals', 'allergies', 'symptom', 'notes',
  'diagnosis', 'location_text', 'latitude', 'longitude',
  'phone', 'email', 'emergency_contact', 'contact',
]);

function scrubObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (PHI_KEYS.has(key)) {
      obj[key] = '[REDACTED]';
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
      // Scrub PHI from extra data
      if (event.extra) {
        scrubObject(event.extra as Record<string, unknown>);
      }

      // Scrub PHI from breadcrumb data
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          if (crumb.data) {
            scrubObject(crumb.data as Record<string, unknown>);
          }
        }
      }

      // Scrub PHI from context
      if (event.contexts) {
        for (const ctx of Object.values(event.contexts)) {
          if (ctx && typeof ctx === 'object') {
            scrubObject(ctx as Record<string, unknown>);
          }
        }
      }

      return event;
    },
  });
}

export { Sentry };
