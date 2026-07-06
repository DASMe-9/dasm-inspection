import Link from "next/link";
import { PUBLIC_BRAND } from "./brand-tokens";

const LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "من نحن" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/workshops", label: "مواقع الخدمة" },
  { href: "/#contact", label: "تواصل معنا" },
];

export function PublicSiteFooter() {
  const year = 1447; // سنة هجرية ثابتة (بدون Date وقت التصيير الثابت)
  return (
    <footer
      className="mt-16 border-t border-white/10 text-white"
      style={{ background: PUBLIC_BRAND.navy }}
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                style={{
                  background:
                    "linear-gradient(135deg,#1E74E8 0%,#2FBF4E 100%)",
                }}
              >
                DE
              </span>
              <div>
                <p className="text-sm font-bold">داسم للفحص</p>
                <p className="text-[11px] text-white/70">
                  منصّة الفحص الفني للمركبات
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/70">
              شبكة معتمدة للفحص الفني للمركبات — طلبات، تقارير، وسجل فني موثّق ضمن
              منظومة داسم.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm"
            aria-label="روابط الفوتر"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white/80 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {year}هـ داسم للفحص الفني. جميع الحقوق محفوظة.</p>
          <p>
            <a
              href="mailto:support@dasm.com.sa"
              className="hover:text-white"
            >
              support@dasm.com.sa
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
