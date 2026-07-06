import type { AppRole } from "@/types";
import {
  INSPECTION_HEADER_INSPECTION_ROLE,
  INSPECTION_HEADER_USER_ID,
  INSPECTION_HEADER_VERIFIED,
} from "@/lib/auth/inspection-headers";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

const KNOWN_ROLES: readonly AppRole[] = [
  "super_admin",
  "inspection_admin",
  "workshop_manager",
  "workshop_owner",
  "mechanic",
  "inspector",
  "viewer",
  "dasm_user",
] as const;

export type InspectionNavKey =
  | "dashboard"
  | "workshop_dashboard"
  | "requests"
  | "my_inspections"
  | "workshops"
  | "subscription"
  | "settings";

export type ResolvedInspectionPersona = {
  persona: AppRole | "unknown";
  /** معرف مستخدم المنصّة (JWT أو بوابة) عند توفره */
  platformUserId: string | null;
  trust: "jwt" | "gateway_cookie" | "none";
};

function parseRole(raw: string | undefined | null): AppRole | null {
  if (!raw?.trim()) return null;
  const v = raw.trim() as AppRole;
  return (KNOWN_ROLES as readonly string[]).includes(v) ? v : null;
}

/** ناتج `await cookies()` في Next.js 14 App Router */
export type InspectionRequestCookies = Awaited<
  ReturnType<typeof import("next/headers").cookies>
>;

/** يقرأ الدور من رؤوس JWT المُحقَّقة أو من كوكي البوابة (تلميع UX فقط). */
export function resolveInspectionPersona(
  headersList: Headers,
  cookieStore: InspectionRequestCookies
): ResolvedInspectionPersona {
  const jwtOk = headersList.get(INSPECTION_HEADER_VERIFIED) === "1";
  const headerRole = parseRole(headersList.get(INSPECTION_HEADER_INSPECTION_ROLE));
  const headerUserId = headersList.get(INSPECTION_HEADER_USER_ID)?.trim() || null;

  if (jwtOk && headerRole) {
    return { persona: headerRole, platformUserId: headerUserId, trust: "jwt" };
  }

  const cookieRole = parseRole(cookieStore.get(INSPECTION_UI_ROLE_COOKIE)?.value);
  const cookieUserId =
    cookieStore.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() || null;

  if (cookieRole === "dasm_user" && cookieUserId) {
    return {
      persona: "dasm_user",
      platformUserId: cookieUserId,
      trust: "gateway_cookie",
    };
  }

  return { persona: "unknown", platformUserId: null, trust: "none" };
}

/** قائمة الطلبات في `/requests` ولوحة KPI للمستخدم المنصّاتي فقط. */
export function shouldScopeRequestsToPlatformUser(
  r: ResolvedInspectionPersona
): boolean {
  return r.persona === "dasm_user" && Boolean(r.platformUserId);
}

/** عناصر الشريط الجانبي / الجوال بحسب دور الواجهة. */
export function visibleNavKeys(
  persona: ResolvedInspectionPersona["persona"]
): Set<InspectionNavKey> {
  const all: InspectionNavKey[] = [
    "dashboard",
    "workshop_dashboard",
    "requests",
    "my_inspections",
    "workshops",
    "subscription",
    "settings",
  ];

  // «لوحة الورشة» صفحة مقفلة لغير صاحب/مدير الورشة والأدمن — لا تُعرَض في القائمة
  // لهم حتى لا يظهر زرّ يؤدي لصفحة «غير متاحة».
  const withoutWorkshop = all.filter((k) => k !== "workshop_dashboard");

  if (persona === "unknown") return new Set(withoutWorkshop);

  if (persona === "dasm_user") return new Set(withoutWorkshop);

  if (persona === "workshop_owner" || persona === "workshop_manager") {
    return new Set<InspectionNavKey>([
      "workshop_dashboard",
      "requests",
      "settings",
    ]);
  }

  if (persona === "inspector" || persona === "mechanic") {
    return new Set(
      withoutWorkshop.filter((k) => k !== "subscription")
    );
  }

  if (persona === "viewer") {
    return new Set(
      withoutWorkshop.filter((k) => k !== "subscription")
    );
  }

  if (persona === "super_admin" || persona === "inspection_admin") {
    return new Set(all);
  }

  return new Set(withoutWorkshop);
}
