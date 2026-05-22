import Link from "next/link";
import { Shield, FileCheck, MapPinned, Headphones } from "lucide-react";
import { PUBLIC_BRAND } from "./brand-tokens";

const FEATURES = [
  {
    icon: Shield,
    title: "ورش معتمدة",
    text: "شبكة شركاء فحص موثّقة ضمن معايير داسم.",
  },
  {
    icon: FileCheck,
    title: "تقارير رقمية",
    text: "تقرير فني مع صور وبنود فحص قابلة للمشاركة.",
  },
  {
    icon: MapPinned,
    title: "تتبّع الطلب",
    text: "متابعة حالة الفحص من التقديم حتى الاعتماد.",
  },
  {
    icon: Headphones,
    title: "دعم العملاء",
    text: "قنوات تواصل واضحة لمالك المركبة والورشة.",
  },
] as const;

const FAQ = [
  {
    q: "هل أحتاج حساباً لاستعراض الورش؟",
    a: "يمكنك تصفّح الورش المعتمدة وملفاتها العامة دون تسجيل. لطلب فحص أو إدارة ورشتك استخدم تسجيل الدخول.",
  },
  {
    q: "من يمكنه تسجيل الدخول؟",
    a: "فريق داسم، مالكو الورش، المفتشون، والعملاء المصرّح لهم عبر منصّة داسم.",
  },
] as const;

export function PublicHomeSections() {
  return (
    <>
      <section
        id="services"
        className="bg-white px-4 py-14 md:px-6 md:py-20"
        dir="rtl"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center md:text-right">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              تفاصيل الخدمة
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 md:text-base">
              فحص فني شامل للمركبات عبر شركاء معتمدين، مع تقارير موثّقة وتكامل
              مع منظومة داسم.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
              >
                <div
                  className="mb-4 inline-flex rounded-xl p-3 text-white"
                  style={{ background: PUBLIC_BRAND.navy }}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="border-t border-gray-100 bg-slate-50 px-4 py-14 md:px-6"
        dir="rtl"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">أسئلة متكررة</h2>
          <ul className="mt-8 space-y-6">
            {FAQ.map((item) => (
              <li
                key={item.q}
                className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="support"
        className="px-4 py-12 md:px-6"
        style={{ background: PUBLIC_BRAND.navy }}
        dir="rtl"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-right">
            <h2 className="text-xl font-bold text-white md:text-2xl">
              خدمة العملاء
            </h2>
            <p className="mt-2 text-sm text-white/75">
              للاستفسارات التشغيلية تواصل عبر منصّة داسم الرئيسية.
            </p>
          </div>
          <Link
            href="https://www.dasm.com.sa"
            className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            منصّة داسم
          </Link>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 md:px-6"
        dir="rtl"
      >
        <p>© {new Date().getFullYear()} فحص داسم — جزء من منظومة DASM</p>
        <p className="mt-2">
          <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: PUBLIC_BRAND.greenDark }}>
            تسجيل الدخول
          </Link>
          {" · "}
          <Link href="/workshops" className="font-semibold hover:underline" style={{ color: PUBLIC_BRAND.greenDark }}>
            الورش المعتمدة
          </Link>
        </p>
      </section>
    </>
  );
}
