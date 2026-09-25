import Link from "next/link";
import type { ReactNode } from "react";
import { InspectionLogo, PUBLIC_BRAND } from "@/components/public-site";

/**
 * قشرة صفحات الدخول — سطح كحلي هادئ يربط خدمة الفحص بهوية DASM.
 * تُستخدم في الدخول وعودة الدخول الاجتماعي وشاشة «غير مخوّل».
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
      style={{ backgroundColor: PUBLIC_BRAND.navyDeep }}
    >
      <div className="inspection-grid absolute inset-0 -z-10 opacity-60" aria-hidden />

      <header className="mx-auto flex w-full max-w-md flex-col items-center px-4 pb-5 pt-6 sm:px-6">
        <InspectionLogo />
        <div
          className="mt-4 h-10 w-full overflow-hidden rounded-lg border border-white/15 bg-white/[0.06]"
          aria-label="آخر أخبار الفحص"
        >
          <span className="inspection-news-ticker block w-max whitespace-nowrap px-3 py-2.5 text-xs text-white/70">
            اطلب فحصاً في مركز الفحص أو موقع المركبة وتابع التقرير المعتمد من حسابك
          </span>
        </div>
        <p className="mt-4 text-xl font-extrabold" dir="rtl">
          <span dir="ltr">DASM</span>{" "}
          <span style={{ color: PUBLIC_BRAND.green }}>تجمعنا</span>
        </p>
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
          فحص DASM — منظومة{" "}
          <a
            href="https://www.dasm.com.sa"
            className="font-semibold text-white/65 underline-offset-4 hover:text-white hover:underline"
          >
            DASM
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

/** بطاقة دخول موحّدة داخل القشرة. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/15 bg-[#071a30] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.26)] sm:p-8">
      {children}
    </div>
  );
}
