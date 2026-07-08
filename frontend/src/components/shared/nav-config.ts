import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";

export type SidebarNavItem = {
  key: InspectionNavKey;
  href: string;
  label: string;
  icon: string;
};

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { key: "dashboard", href: "/dashboard", label: "لوحة التحكم", icon: "📊" },
      {
        key: "workshop_dashboard",
        href: "/workshop",
        label: "لوحة الورشة",
        icon: "🏭",
      },
    ],
  },
  {
    label: "إدارة الفحص",
    items: [
      { key: "requests", href: "/requests", label: "طلبات الفحص", icon: "📋" },
      { key: "my_inspections", href: "/my-inspections", label: "طلباتي", icon: "👤" },
      { key: "workshops", href: "/directory", label: "الورش المعتمدة", icon: "🔧" },
    ],
  },
  {
    label: "المالية",
    items: [
      { key: "wallet", href: "/wallet", label: "المحفظة", icon: "💰" },
      {
        key: "subscription",
        href: "/subscription",
        label: "الاشتراك الشهري",
        icon: "💳",
      },
    ],
  },
  {
    label: "النظام",
    items: [{ key: "settings", href: "/settings", label: "الإعدادات", icon: "⚙️" }],
  },
];

/** ترتيب شريط التنقّل السفلي للجوال (مختصر عن مجموعات الشريط الجانبي). */
export const MOBILE_BOTTOM_NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "الرئيسية", icon: "🏠" },
  {
    key: "workshop_dashboard",
    href: "/workshop",
    label: "الورشة",
    icon: "🏭",
  },
  { key: "requests", href: "/requests", label: "الطلبات", icon: "📋" },
  {
    key: "my_inspections",
    href: "/my-inspections",
    label: "طلباتي",
    icon: "👤",
  },
  { key: "workshops", href: "/directory", label: "الورش", icon: "🔧" },
  { key: "wallet", href: "/wallet", label: "المحفظة", icon: "💰" },
  { key: "settings", href: "/settings", label: "الإعدادات", icon: "⚙️" },
];

export function filterSidebarNavGroups(
  allowed: Set<InspectionNavKey>
): SidebarNavGroup[] {
  return SIDEBAR_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => allowed.has(i.key)),
  })).filter((g) => g.items.length > 0);
}
