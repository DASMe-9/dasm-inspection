/** ألوان الواجهة العامة — مُوائمة مع هوية شعار داسم (كحلي + أزرق→أخضر) */
export const PUBLIC_BRAND = {
  navy: "#0B1E3A",
  navyDeep: "#071528",
  navyGlass: "rgba(11, 30, 58, 0.92)",
  green: "#2FBF4E",
  greenHover: "#28a944",
  greenDark: "#1f8c38",
  blue: "#1E74E8",
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
  { href: "/#contact", label: "تواصل معنا" },
  { href: "/workshops", label: "احجز موعدك" },
];
