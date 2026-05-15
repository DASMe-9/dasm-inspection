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
    items: [{ key: "dashboard", href: "/", label: "لوحة التحكم", icon: "📊" }],
  },
  {
    label: "إدارة الفحص",
    items: [
      { key: "requests", href: "/requests", label: "طلبات الفحص", icon: "📋" },
      { key: "my_inspections", href: "/my-inspections", label: "طلباتي", icon: "👤" },
      { key: "workshops", href: "/workshops", label: "الورش المعتمدة", icon: "🔧" },
    ],
  },
  {
    label: "الاشتراك",
    items: [
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

export function filterSidebarNavGroups(
  allowed: Set<InspectionNavKey>
): SidebarNavGroup[] {
  return SIDEBAR_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => allowed.has(i.key)),
  })).filter((g) => g.items.length > 0);
}
