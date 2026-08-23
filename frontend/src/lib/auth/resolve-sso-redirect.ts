import {
  resolveInspectionRoleFromPlatformUser,
  type PlatformProfileForInspection,
} from "@/lib/auth/platform-inspection-role";

/** أقصى طول لمسار داخلي مقبول. مطابق لـ service_launch.limits.max_internal_path. */
const MAX_INTERNAL_PATH = 512;

/** أقصى عدد جولات فكّ ترميز قبل اعتبار المسار ترميزاً عميقاً مصطنعاً. */
const MAX_DECODE_ROUNDS = 5;

/**
 * مجموعة ASCII الآمنة لعناوين المواقع، بلا `:` وبلا `\`.
 * أي نص عربي أو مسافة يجب أن يصل مُرمّزاً — وهذا مقصود.
 */
const PATH_CHARSET = /^\/[A-Za-z0-9\-._~/?#[\]@!$&'()*+,;=%]*$/;

/** بداية مسار تفتحها المتصفحات كعنوان بروتوكول-نسبي (`//host` أو `/\host`). */
const PROTOCOL_RELATIVE = /^\/[\\/]/;

/**
 * محارف تحكّم — تُستعمل لتقسيم الترويسات وخداع مطبِّع العنوان.
 *
 * المسافة (0x20) ليست منها عمداً: النصّ الخام يمنعها أصلاً عبر PATH_CHARSET،
 * أمّا بعد فكّ الترميز فـ`%20` مسافة مشروعة داخل قيمة تعبئة مثل
 * «Camry 2020» التي ترسلها أزرار داسم الأم.
 */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/** الفحوص الشكلية المشتركة بين النصّ الخام والنصّ بعد كل جولة فكّ ترميز. */
function isSafePathShape(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (PROTOCOL_RELATIVE.test(value)) return false;
  if (value.includes("\\")) return false;
  if (value.includes("..")) return false;
  if (CONTROL_CHARS.test(value)) return false;
  if (value.toLowerCase().includes("://")) return false;
  return true;
}

/** فكّ ترميز لا يرمي عند نسبة مئوية غير صالحة (`%zz`). */
function decodeOnce(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * وجهة داخلية آمنة، وإلا `null`.
 *
 * الفحص السابق كان `startsWith("//") || includes("://")`، وهو يمرّر
 * `/\evil.com` — وكل المتصفحات تطبّع الشرطة العكسية إلى مائلة، فيُسلَّم
 * المستخدم لنطاق مهاجم مباشرة بعد دخول ناجح. ويمرّر كذلك `/%2F%2Fevil.com`
 * لأنه لم يكن يفكّ الترميز إطلاقاً.
 *
 * نفس قواعد `App\Support\ServiceLaunch::sanitizeInternalPath` في المنصّة
 * الأم و`service-launch.ts` في ويب الشحن و`sso-return-url.ts` في المتاجر —
 * انظر البند 8 من عقد إطلاق لوحات الخدمات.
 */
export function sanitizeInspectionRedirect(raw: string | null): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.trim();
  if (path === "" || path.length > MAX_INTERNAL_PATH) return null;
  if (!PATH_CHARSET.test(path)) return null;
  if (!isSafePathShape(path)) return null;

  let current = path;
  for (let round = 0; round < MAX_DECODE_ROUNDS; round++) {
    const decoded = decodeOnce(current);
    if (decoded === current) return path;
    if (!isSafePathShape(decoded)) return null;
    current = decoded;
  }

  return null;
}

/** Maps paths emitted by DASM dashboard SSO buttons to inspection routes. */
export function mapPlatformSsoRedirectPath(raw: string | null): string | null {
  const path = sanitizeInspectionRedirect(raw);
  if (!path) return null;

  const url = new URL(path, "http://local");
  const search = url.search; // includes leading "?" or ""

  if (url.pathname === "/request") {
    return `/requests${search}`;
  }

  if (url.pathname === "/tracking" && !url.searchParams.has("id")) {
    return `/my-inspections${search}`;
  }

  const trackingId = url.pathname === "/tracking" ? url.searchParams.get("id")?.trim() : null;
  if (url.pathname === "/tracking" && trackingId) {
    return `/track/${encodeURIComponent(trackingId)}`;
  }

  // Legacy: "/tracking?id=…" when pathname parsing already handled above;
  // keep exact string match for callers that pass query-only style.
  const trackingMatch = path.match(/^\/tracking\?(.+)$/);
  if (trackingMatch) {
    const params = new URLSearchParams(trackingMatch[1]);
    const id = params.get("id")?.trim();
    if (id) return `/track/${encodeURIComponent(id)}`;
    return "/my-inspections";
  }

  return path;
}

export function defaultInspectionLandingPath(
  profile: PlatformProfileForInspection
): string {
  const role = resolveInspectionRoleFromPlatformUser(profile);
  if (role === "dasm_user") return "/my-inspections";
  if (role === "workshop_owner" || role === "workshop_manager") return "/workshop";
  return "/requests";
}

export function buildPostSsoDestination(
  redirectParam: string | null,
  profile: PlatformProfileForInspection,
  userId: string,
  userName: string
): string {
  const mapped =
    mapPlatformSsoRedirectPath(redirectParam) ??
    defaultInspectionLandingPath(profile);

  const role = resolveInspectionRoleFromPlatformUser(profile);
  if (role !== "dasm_user") return mapped;

  const needsGateway =
    mapped === "/requests" ||
    mapped.startsWith("/requests?") ||
    mapped === "/my-inspections" ||
    mapped.startsWith("/my-inspections?");

  if (!needsGateway) return mapped;

  const url = new URL(mapped, "http://local");
  url.searchParams.set("gateway", "dasm");
  url.searchParams.set("dasm_user_id", userId);
  if (userName.trim()) url.searchParams.set("user_name", userName.trim());
  return `${url.pathname}${url.search}`;
}
