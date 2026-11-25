import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent, sentryDataCollection } from "@/lib/sentry-scrub";

// Only active with SENTRY_DSN. Privacy: see sentryDataCollection and scrubSentryEvent.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  dataCollection: sentryDataCollection,
  tracesSampleRate: 0.1,
  beforeSend: scrubSentryEvent,
});
