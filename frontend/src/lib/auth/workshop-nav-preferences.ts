import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";

/** عناصر يمكن لمالك الورشة إخفاؤها من الشريط (لا يشمل لوحة الورشة الأساسية). */
export const WORKSHOP_CUSTOMIZABLE_NAV_KEYS = [
  "requests",
  "wallet",
  "subscription",
  "settings",
] as const satisfies readonly InspectionNavKey[];

export type WorkshopCustomizableNavKey =
  (typeof WORKSHOP_CUSTOMIZABLE_NAV_KEYS)[number];

export const WORKSHOP_NAV_LABELS: Record<WorkshopCustomizableNavKey, string> = {
  requests: "طلبات الفحص",
  wallet: "المحفظة",
  subscription: "الاشتراك الشهري",
  settings: "الإعدادات",
};

export function parseHiddenNavKeys(raw: unknown): InspectionNavKey[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(WORKSHOP_CUSTOMIZABLE_NAV_KEYS);
  return raw.filter(
    (k): k is InspectionNavKey =>
      typeof k === "string" && allowed.has(k as InspectionNavKey)
  );
}

export function applyHiddenNavKeys(
  base: Set<InspectionNavKey>,
  hidden: readonly string[] | null | undefined
): Set<InspectionNavKey> {
  const out = new Set(base);
  for (const key of hidden ?? []) {
    if ((WORKSHOP_CUSTOMIZABLE_NAV_KEYS as readonly string[]).includes(key)) {
      out.delete(key as InspectionNavKey);
    }
  }
  return out;
}
