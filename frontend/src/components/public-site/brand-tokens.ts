/** ألوان الواجهة العامة (أسلوب MVPI — أزرق داكن + أخضر ليموني) */
export const PUBLIC_BRAND = {
  navy: "#0c1f3d",
  navyDeep: "#071428",
  navyGlass: "rgba(12, 31, 61, 0.92)",
  green: "#8dc63f",
  greenHover: "#7ab82f",
  greenDark: "#5a9a1a",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.75)",
} as const;

export const PUBLIC_NAV_LINKS = [
  { href: "/", label: "الصفحة الرئيسية", exact: true },
  { href: "/#services", label: "تفاصيل الخدمة" },
  { href: "/workshops", label: "مواقع الخدمة" },
  { href: "/#faq", label: "أسئلة متكررة" },
  { href: "/#support", label: "خدمة العملاء" },
  { href: "/#contact", label: "تواصل معنا" },
  { href: "/workshops", label: "احجز موعدك" },
] as const;
