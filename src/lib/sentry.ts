import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // 환자 데이터 제거
      if (event.extra) {
        delete event.extra.patient_name;
        delete event.extra.vitals;
      }
      return event;
    },
  });
}

export { Sentry };
