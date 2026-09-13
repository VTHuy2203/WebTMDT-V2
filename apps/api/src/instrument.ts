import "dotenv/config";
import * as Sentry from "@sentry/nestjs";

const dsn = process.env.SENTRY_DSN?.trim();
const configuredSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1);
const tracesSampleRate = Number.isFinite(configuredSampleRate)
  ? Math.min(1, Math.max(0, configuredSampleRate))
  : 0.1;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
  release: process.env.SENTRY_RELEASE || undefined,
  sendDefaultPii: false,
  tracesSampleRate,
});
Sentry.setTag("app", "api");

export async function sendSentryVerificationError() {
  if (!dsn) return null;
  const eventId = Sentry.captureException(
    new Error("Sentry verification error: api"),
    { tags: { app: "api", verification: "true" } },
  );
  await Sentry.flush(2000);
  return eventId;
}

if (process.env.SENTRY_VERIFY_ON_STARTUP === "true")
  void sendSentryVerificationError().then((eventId) => {
    if (eventId) console.info(`[sentry] api verification event: ${eventId}`);
  });
