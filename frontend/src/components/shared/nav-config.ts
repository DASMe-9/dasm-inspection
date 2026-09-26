import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";
import {
  BadgeDollarSign,
  Building2,
  CarFront,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Users,
  UserRound,
  WalletCards,
  Wrench,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export type SidebarNavItem = {
  key: InspectionNavKey;
  href: string;
  label: string;
  icon: LucideIcon;
};

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { key: "dashboard", href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
      {
        key: "workshop_dashboard",
        href: "/workshop",
        label: "لوحة الورشة",
        icon: Building2,
      },
    ],
  },
  {
    label: "إدارة الورشة",
    items: [
      {
        key: "workshop_team",
        href: "/workshop/team",
        label: "إدارة الفريق",
        icon: Users,
      },
      {
        key: "workshop_pricing",
        href: "/workshop/pricing",
        label: "أسعار الخدمة",
        icon: BadgeDollarSign,
      },
      {
        key: "workshop_areas",
        href: "/workshop/areas",
        label: "مناطق الخدمة",
        icon: MapPin,
      },
    ],
  },
  {
    label: "إدارة الفحص",
    items: [
      { key: "requests", href: "/requests", label: "طلبات الفحص", icon: ClipboardList },
      {
        key: "my_inspections",
        href: "/my-inspections",
        label: "طلبات الفحص",
        icon: UserRound,
      },
      {
        key: "my_vehicles",
        href: "/my-vehicles",
        label: "مركباتي",
        icon: CarFront,
      },
      { key: "workshops", href: "/directory", label: "مراكز الفحص", icon: Wrench },
    ],
  },
  {
    label: "المالية",
    items: [
      { key: "wallet", href: "/wallet", label: "المحفظة", icon: WalletCards },
      {
        key: "subscription",
        href: "/subscription",
        label: "الاشتراك الشهري",
        icon: Gauge,
      },
    ],
  },
  {
    label: "النظام",
    items: [{ key: "settings", href: "/settings", label: "الإعدادات", icon: Settings }],
  },
];

/** ترتيب شريط التنقّل السفلي للجوال (مختصر عن مجموعات الشريط الجانبي). */
export const MOBILE_BOTTOM_NAV_ITEMS: SidebarNavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  {
    key: "workshop_dashboard",
    href: "/workshop",
    label: "الورشة",
    icon: Building2,
  },
  { key: "requests", href: "/requests", label: "الطلبات", icon: ClipboardList },
  {
    key: "my_inspections",
    href: "/my-inspections",
    label: "طلباتي",
    icon: UserRound,
  },
  {
    key: "my_vehicles",
    href: "/my-vehicles",
    label: "مركباتي",
    icon: CarFront,
  },
  { key: "workshops", href: "/directory", label: "المراكز", icon: Wrench },
  { key: "wallet", href: "/wallet", label: "المحفظة", icon: WalletCards },
  { key: "settings", href: "/settings", label: "الإعدادات", icon: SlidersHorizontal },
];

export function filterSidebarNavGroups(
  allowed: Set<InspectionNavKey>
): SidebarNavGroup[] {
  return SIDEBAR_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => allowed.has(i.key)),
  })).filter((g) => g.items.length > 0);
}
