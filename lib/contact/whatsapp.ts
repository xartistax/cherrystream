export function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export function createWhatsAppUrl(phoneNumber: string, message?: string): string {
  const normalizedNumber = normalizeWhatsAppNumber(phoneNumber).replace(/^\+/, "");

  const url = new URL(`https://wa.me/${normalizedNumber}`);

  if (message?.trim()) {
    url.searchParams.set("text", message.trim());
  }

  return url.toString();
}
