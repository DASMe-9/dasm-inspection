/** ألوان الواجهة العامة — مُوائمة مع هوية شعار داسم (كحلي + أزرق→أخضر) */
export const PUBLIC_BRAND = {
  navy: "#0A2342",
  navyDeep: "#051529",
  navyElevated: "#103254",
  navyGlass: "rgba(5, 21, 41, 0.94)",
  green: "#2CCB66",
  greenHover: "#24b95a",
  greenDark: "#178847",
  blue: "#3186F4",
  ice: "#F3F8FB",
  amber: "#F4B942",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.75)",
} as const;

export type PublicNavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

export const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { href: "/", label: "الصفحة الرئيسية", exact: true },
  { href: "/#services", label: "تفاصيل الخدمة" },
  { href: "/workshops", label: "مواقع الخدمة" },
  { href: "/#faq", label: "أسئلة متكررة" },
  { href: "/#support", label: "خدمة العملاء" },
  { href: "/workshops", label: "احجز موعدك" },
];
