/** يبني رابط خرائط يفتح تطبيق GPS/الخرائط من رمز العنوان الوطني. */
export function mapsUrlFromNationalAddress(code: string): string | null {
  const trimmed = code.trim().replace(/\s+/g, "");
  if (!trimmed) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

export function normalizeNationalAddressCode(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "").toUpperCase();
  return trimmed || null;
}
