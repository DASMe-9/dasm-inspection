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

/** نوع طلب الشحن: طرد صغير، أو نقل ثقيل (سطحة/دينة). */
export type ShipmentKind = "parcel" | "transport";

/**
 * معرّف مرجعي مقبول في جسر الإطلاق: حروف وأرقام وشرطة وشرطة سفلية، حتى 64
 * محرفاً. الجسر يُسقط ما لا يطابق، فنتجنّب إرساله أصلاً.
 */
function toShipmentRef(value: unknown): string | null {
  const ref = String(value ?? "").trim();
  if (!ref || ref.length > 64) return null;
  return /^[A-Za-z0-9_-]+$/.test(ref) ? ref : null;
}

/**
 * رابط طلب شحن عبر جسر داسم الأم.
 *
 * لا يبني الفحص رابطاً خاماً إلى نطاق الشحن ولا يولّد رمز عبور: يرسل المستخدم
 * إلى `/shipping/launch` في داسم، وهي تولّد الرمز وتُكمل الانتقال — البند 4-1
 * من عقد إطلاق لوحات الخدمات. وهو أيضاً الطريق الوحيد الممكن من هنا، لأن
 * إصدار رمز العبور صار صلاحية أوّلية والفحص يحمل توكن جلسة مشتقّاً.
 *
 * النطاق المعتمد للشحن يعرفه الجسر وحده (`backend/config/service_launch.php`).
 */
export function getShipmentLaunchUrl(options: {
  ref?: number | string | null;
  kind: ShipmentKind;
  prefill?: Record<string, string | null | undefined>;
}): string {
  const qs = new URLSearchParams({ source: "inspection", kind: options.kind });

  const ref = toShipmentRef(options.ref);
  if (ref) qs.set("ref", ref);

  for (const [key, value] of Object.entries(options.prefill ?? {})) {
    const text = String(value ?? "").trim();
    if (text) qs.set(`prefill_${key}`, text);
  }

  return `${getDasmPlatformBaseUrl()}/shipping/launch?${qs.toString()}`;
}
