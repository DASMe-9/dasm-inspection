import Link from "next/link";
import { MapPin, ChevronLeft } from "lucide-react";
import { PUBLIC_BRAND } from "./brand-tokens";

export function PublicHomeHero() {
  return (
    <section className="relative min-h-[min(78vh,720px)] overflow-hidden">
      {/* خلفية تقنية + تدرّج أزرق (بديل صورة الفني في MVPI) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(105deg, ${PUBLIC_BRAND.navyDeep} 0%, ${PUBLIC_BRAND.navy} 42%, rgba(12,31,61,0.55) 100%),
            radial-gradient(ellipse 80% 60% at 15% 50%, rgba(141,198,63,0.12) 0%, transparent 55%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(90deg, transparent 30%, rgba(7,20,40,0.85) 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 pb-28 pt-16 md:px-6 md:pb-32 md:pt-24">
        <div className="max-w-xl space-y-6 text-right">
          <p className="text-sm font-semibold tracking-wide text-white/80">
            منظومة داسم للفحص الفني المعتمد
          </p>
          <h1 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
            معاً لمركبة آمنة
          </h1>
          <p className="text-base leading-relaxed text-white/85 md:text-lg">
            فحص داسم يربطك بورش معتمدة، تقارير موثّقة، وتتبّع رقمي لطلبك — من
            الحجز حتى اعتماد التقرير، ضمن منصّة داسم الموحّدة.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/workshops"
              className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-105"
              style={{ background: PUBLIC_BRAND.green }}
            >
              <MapPin className="h-5 w-5" aria-hidden />
              أقرب ورشة معتمدة
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-md border-2 border-white/40 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              دخول الشركاء والفريق
            </Link>
          </div>
        </div>
      </div>

      {/* موجة انتقال للقسم الأبيض (مثل MVPI) */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 leading-[0]">
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="block h-14 w-full md:h-20"
          aria-hidden
        >
          <path
            fill="#ffffff"
            d="M0,48 C320,95 520,8 720,42 C920,76 1120,18 1440,55 L1440,100 L0,100 Z"
          />
        </svg>
      </div>
    </section>
  );
}
