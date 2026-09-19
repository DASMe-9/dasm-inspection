import Link from "next/link";
import type { ReactNode } from "react";
import { InspectionLogo, PUBLIC_BRAND } from "@/components/public-site";

/**
 * قشرة صفحات الدخول — نفس خلفية بطل الصفحة العامة (كحلي + شبكة + توهّج أخضر/أزرق)
 * وبطاقة زجاجية في الوسط. تُستخدم في الدخول وعودة الدخول الاجتماعي وشاشة «غير مخوّل».
 */
export function AuthShell({
  children,
  aside,
}: {
  children: ReactNode;
  /** لوحة تعريفية تظهر بجانب البطاقة على الشاشات الكبيرة فقط. */
  aside?: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="relative isolate flex min-h-screen flex-col overflow-hidden text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle at 8% 16%, rgba(49,134,244,0.22), transparent 32%),
          radial-gradient(circle at 88% 82%, rgba(44,203,102,0.16), transparent 34%),
          linear-gradient(145deg, ${PUBLIC_BRAND.navyDeep} 0%, ${PUBLIC_BRAND.navy} 58%, #0c2e50 100%)
        `,
      }}
    >
      <div className="inspection-grid absolute inset-0 -z-10 opacity-60" aria-hidden />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center"
          aria-label="فحص داسم — الصفحة الرئيسية"
        >
          <InspectionLogo compact />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-white/70 transition hover:text-white"
        >
          الصفحة الرئيسية
        </Link>
      </header>

      <main
        className={`mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 pb-10 sm:px-6 ${
          aside ? "lg:grid-cols-2 lg:gap-16" : ""
        }`}
      >
        {aside && <div className="hidden lg:block">{aside}</div>}
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 text-center text-xs text-white/45 sm:px-6">
        <p>
          فحص داسم — منظومة{" "}
          <a
            href="https://www.dasm.com.sa"
            className="font-semibold text-white/65 underline-offset-4 hover:text-white hover:underline"
          >
            داسم
          </a>
          {" · "}
          <Link href="/privacy" className="hover:text-white">الخصوصية</Link>
          {" · "}
          <Link href="/terms" className="hover:text-white">الشروط</Link>
        </p>
      </footer>
    </div>
  );
}

/** بطاقة زجاجية موحّدة داخل القشرة. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-white/15 bg-[#071a30]/85 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
      {children}
    </div>
  );
}
