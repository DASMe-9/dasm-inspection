import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CarFront,
  ChevronLeft,
  FileCheck2,
  MapPin,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { PUBLIC_BRAND } from "./brand-tokens";

export function PublicHomeHero() {
  return (
    <section className="relative isolate overflow-hidden" aria-labelledby="home-hero-title">
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 8% 16%, rgba(49,134,244,0.22), transparent 30%),
            radial-gradient(circle at 88% 78%, rgba(44,203,102,0.16), transparent 32%),
            linear-gradient(145deg, ${PUBLIC_BRAND.navyDeep} 0%, ${PUBLIC_BRAND.navy} 58%, #0c2e50 100%)
          `,
        }}
        aria-hidden
      />
      <div
        className="inspection-grid absolute inset-0 -z-10 opacity-60"
        aria-hidden
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.76fr)] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="max-w-2xl text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-bold text-white/85 shadow-sm backdrop-blur-sm sm:text-sm">
            <BadgeCheck className="h-4 w-4 text-[var(--inspection-accent)]" aria-hidden />
            منظومة موثّقة للفحص الفني
          </div>
          <h1
            id="home-hero-title"
            className="mt-5 text-balance text-[2.35rem] font-black leading-[1.22] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.75rem]"
          >
            اعرف مركبتك
            <span className="block text-[var(--inspection-accent)]">قبل أن تقود قرارك</span>
          </h1>
          <p className="mt-5 max-w-xl text-[1.05rem] leading-8 text-white/75 sm:text-lg sm:leading-9">
            اختر ورشة معتمدة، تابع الفحص خطوة بخطوة، واستلم تقريراً رقمياً واضحاً يمكنك الرجوع إليه ومشاركته.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/workshops"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 text-base font-extrabold text-white shadow-[0_14px_38px_rgba(44,203,102,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 sm:w-auto"
              style={{ background: PUBLIC_BRAND.green }}
            >
              <MapPin className="h-5 w-5" aria-hidden />
              ابحث عن ورشة معتمدة
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/[0.06] px-6 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
            >
              دخول الشركاء والفريق
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/65 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" aria-hidden />ورش معتمدة</span>
            <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-4 w-4" aria-hidden />تقرير قابل للمشاركة</span>
            <span className="inline-flex items-center gap-1.5"><Radio className="h-4 w-4" aria-hidden />تتبّع واضح</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="مزايا تجربة الفحص">
          <div className="absolute -inset-4 rounded-[2.25rem] bg-gradient-to-br from-white/10 to-transparent blur-xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#071a30]/85 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
            <div className="inspection-scan-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--inspection-accent)] to-transparent" aria-hidden />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">رحلة فحص داسم</p>
                <p className="mt-1 text-lg font-extrabold text-white">كل شيء أمامك بوضوح</p>
              </div>
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--inspection-accent)] text-[#052015] shadow-lg">
                <CarFront className="h-6 w-6" aria-hidden />
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                [BadgeCheck, "اختر بثقة", "بيانات الورشة وخدماتها في مكان واحد"],
                [Radio, "تابع الطلب", "حالة الفحص واضحة منذ الحجز حتى الاعتماد"],
                [FileCheck2, "احتفظ بالنتيجة", "تقرير رقمي منظّم وسهل المشاركة"],
              ].map(([Icon, title, text]) => {
                const ItemIcon = Icon as typeof BadgeCheck;
                return (
                  <div key={title as string} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--inspection-accent)]">
                      <ItemIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-white">{title as string}</p>
                      <p className="mt-1 text-xs leading-5 text-white/55">{text as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[var(--inspection-accent)]/10 px-4 py-3 text-xs font-bold text-white/70">
              <span>من الحجز إلى التقرير</span>
              <span className="inline-flex items-center gap-1 text-[var(--inspection-accent)]"><span className="h-2 w-2 rounded-full bg-current" />متصل بمنظومة داسم</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-[var(--inspection-ice)]"
        style={{
          clipPath: "polygon(0 72%, 17% 38%, 34% 65%, 54% 24%, 73% 56%, 100% 18%, 100% 100%, 0 100%)",
        }}
        aria-hidden
      />
    </section>
  );
}
