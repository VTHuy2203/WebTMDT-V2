import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN_BUYER?.trim();
const configuredSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1);

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
  sendDefaultPii: false,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: Number.isFinite(configuredSampleRate)
    ? Math.min(1, Math.max(0, configuredSampleRate))
    : 0.1,
});
Sentry.setTag('app', 'buyer-web');

export async function sendSentryVerificationError() {
  if (!dsn) return null;
  const eventId = Sentry.captureException(
    new Error('Sentry verification error: buyer-web'),
    { tags: { app: 'buyer-web', verification: 'true' } },
  );
  await Sentry.flush(2000);
  return eventId;
}

if (import.meta.env.VITE_SENTRY_VERIFY_ON_STARTUP === 'true')
  void sendSentryVerificationError().then((eventId) => {
    if (eventId) console.info(`[sentry] buyer-web verification event: ${eventId}`);
  });
