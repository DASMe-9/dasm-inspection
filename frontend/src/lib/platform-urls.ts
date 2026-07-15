const trimSlash = (url: string) => url.replace(/\/+$/, "");

/** منصة داسم الأم — روابط عامة (ليست لوحة مسؤول). */
export function getDasmPlatformBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DASM_PLATFORM_URL?.trim();
  return trimSlash(fromEnv && fromEnv.length > 0 ? fromEnv : "https://www.dasm.com.sa");
}

export function getGrandMarketWorkshopUrl(slug: string): string {
  return `${getDasmPlatformBaseUrl()}/grand-market/workshop/${encodeURIComponent(slug)}`;
}

/** ملف الحساب العام على المنصة (تفضيلات إشعارات ونحوها) — ليس دخول مسؤول. */
export function getDasmProfileSecurityUrl(): string {
  return `${getDasmPlatformBaseUrl()}/dashboard/profile`;
}
