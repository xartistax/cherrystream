import "server-only";

import DOMPurify from "isomorphic-dompurify";

export const PROFILE_DESCRIPTION_MAX_LENGTH = 5_000;

export type SanitizedProfileDescription = {
  html: string | null;
  characterCount: number;
};

export function sanitizeProfileDescription(value: string | null): SanitizedProfileDescription {
  if (!value) {
    return {
      html: null,
      characterCount: 0,
    };
  }

  const sanitizedHtml = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "s", "ul", "ol", "li", "blockquote", "h2", "h3"],
    ALLOWED_ATTR: [],
  }).trim();

  const plainText = DOMPurify.sanitize(sanitizedHtml, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
