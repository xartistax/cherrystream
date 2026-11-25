import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent, sentryDataCollection } from "@/lib/sentry-scrub";

// Only active with NEXT_PUBLIC_SENTRY_DSN. No session replay: the app shows adult content and personal profiles.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  dataCollection: sentryDataCollection,
  // Every trace locally, so test requests are visible; 10 % in production.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  beforeSend: scrubSentryEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
