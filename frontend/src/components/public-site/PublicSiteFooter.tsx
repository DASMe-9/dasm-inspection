import Link from "next/link";
import { Mail } from "lucide-react";
import { InspectionLogo } from "./InspectionLogo";

const LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "من نحن" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/workshops", label: "مواقع الخدمة" },
  { href: "/#support", label: "تواصل معنا" },
];

export function PublicSiteFooter() {
  return (
    <footer
      className="border-t border-white/10 bg-[#051529] text-white"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start md:gap-14">
          <div className="max-w-md">
            <InspectionLogo compact />
            <p className="mt-4 text-sm leading-7 text-white/60">
              شبكة معتمدة للفحص الفني للمركبات — طلبات، تقارير، وسجل فني موثّق ضمن
              منظومة داسم.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-5 text-sm sm:gap-x-10"
            aria-label="روابط الفوتر"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex min-h-11 items-center text-white/70 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>فحص داسم الفني — جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-2" dir="ltr">
            <Mail className="h-4 w-4" aria-hidden />
            <a
              href="mailto:support@dasm.com.sa"
              className="inline-flex min-h-11 items-center hover:text-white"
            >
              support@dasm.com.sa
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
