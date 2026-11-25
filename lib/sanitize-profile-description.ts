import "server-only";

import sanitizeHtml from "sanitize-html";

export const PROFILE_DESCRIPTION_MAX_LENGTH = 5_000;

export type SanitizedProfileDescription = {
  html: string | null;
  characterCount: number;
};

const ALLOWED_TAGS = ["p", "br", "strong", "em", "s", "ul", "ol", "li", "blockquote", "h2", "h3"];

// sanitize-html instead of DOMPurify: DOMPurify needs jsdom on the server, which fails to load on Vercel (ESM-only dependency).
function toPlainText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;| /g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeProfileDescription(value: string | null): SanitizedProfileDescription {
  if (!value) {
    return {
      html: null,
      characterCount: 0,
    };
  }

  const sanitizedHtml = sanitizeHtml(value, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    // Content of script/style elements is dropped entirely, not kept as text.
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
  }).trim();

  const plainText = toPlainText(sanitizedHtml);

  if (plainText.length > PROFILE_DESCRIPTION_MAX_LENGTH) {
    throw new Error("PROFILE_DESCRIPTION_TOO_LONG");
  }

  if (!plainText) {
    return {
      html: null,
      characterCount: 0,
    };
  }

  return {
    html: sanitizedHtml,
    characterCount: plainText.length,
  };
}
