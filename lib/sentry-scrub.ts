import type { ErrorEvent, init } from "@sentry/nextjs";

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>["dataCollection"]>;

/**
 * Sentry 11 collects cookies, headers and request/response bodies by default. For an adult platform with
 * personal profiles we send none of that: no user info, no cookies, no bodies, no query strings, only harmless headers.
 */
const ALLOWED_REQUEST_HEADERS = ["user-agent", "content-type", "accept-language"];

export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: {
      allow: ALLOWED_REQUEST_HEADERS,
    },
    response: false,
  },
  httpBodies: [],
  urlQueryParams: false,
} satisfies DataCollection;

// Path segments that carry one-time tokens (invite, password reset, email verification links).
const TOKEN_PATHS = /\/(claim|reset-password|verify-email)\/[^/?#]+/g;

function scrubUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url;
  }

  return url.replace(TOKEN_PATHS, "/$1/[token]").replace(/\?.*$/, "");
}

/** Removes tokens, query strings, cookies and bodies before an event leaves the app. */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    event.request.url = scrubUrl(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.data;

    // Next.js' request error hook attaches headers itself, so the allowlist is enforced here as well.
    if (event.request.headers) {
      event.request.headers = Object.fromEntries(
        Object.entries(event.request.headers).filter(([name]) => ALLOWED_REQUEST_HEADERS.includes(name.toLowerCase())),
      );
    }
  }

  if (event.transaction) {
    event.transaction = scrubUrl(event.transaction);
  }

  event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
    ...breadcrumb,
    message: scrubUrl(breadcrumb.message),
    data: breadcrumb.data
      ? {
          ...breadcrumb.data,
          url: typeof breadcrumb.data.url === "string" ? scrubUrl(breadcrumb.data.url) : breadcrumb.data.url,
          to: typeof breadcrumb.data.to === "string" ? scrubUrl(breadcrumb.data.to) : breadcrumb.data.to,
          from: typeof breadcrumb.data.from === "string" ? scrubUrl(breadcrumb.data.from) : breadcrumb.data.from,
        }
      : breadcrumb.data,
  }));

  return event;
}
