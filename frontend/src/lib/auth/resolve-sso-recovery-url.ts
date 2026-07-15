const PLATFORM_WORKSHOP_URL = "https://www.dasm.com.sa/workshop";
const ALLOWED_PLATFORM_ORIGINS = new Set([
  "https://www.dasm.com.sa",
  "https://dasm.com.sa",
]);

/**
 * The callback may receive a Core return_url. Keep recovery constrained to the
 * workshop launcher so an untrusted callback cannot create an open redirect.
 */
export function resolveSsoRecoveryUrl(raw: string | null): string {
  if (!raw) return PLATFORM_WORKSHOP_URL;

  try {
    const url = new URL(raw, PLATFORM_WORKSHOP_URL);
    if (!ALLOWED_PLATFORM_ORIGINS.has(url.origin)) return PLATFORM_WORKSHOP_URL;
    if (url.username || url.password) return PLATFORM_WORKSHOP_URL;
    if (url.pathname !== "/workshop") return PLATFORM_WORKSHOP_URL;

    url.hash = "";
    return url.toString();
  } catch {
    return PLATFORM_WORKSHOP_URL;
  }
}
