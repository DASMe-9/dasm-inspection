import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck2,
  FileCheck2,
  Headphones,
  MapPinned,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

const JOURNEY = [
  {
    icon: MapPinned,
    label: "اختيار الورشة",
    title: "جد الورشة المناسبة",
    text: "استعرض مواقع الخدمة وبيانات الورش المعتمدة قبل أن تختار.",
  },
  {
    icon: ScanLine,
    label: "تنفيذ الفحص",
    title: "تابع حالة مركبتك",
    text: "اعرف أين وصل الطلب من الاستلام وحتى اعتماد نتيجة الفحص.",
  },
  {
    icon: FileCheck2,
    label: "استلام النتيجة",
    title: "تقرير يبقى معك",
    text: "راجع تقريراً رقمياً منظّماً وشاركه وقتما تحتاج.",
  },
] as const;

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "شبكة موثّقة",
    text: "شركاء فحص ضمن منظومة داسم.",
  },
  {
    icon: CalendarCheck2,
    title: "رحلة منظّمة",
    text: "خطوات واضحة من الحجز إلى الاعتماد.",
  },
  {
    icon: BadgeCheck,
    title: "سجل قابل للرجوع",
    text: "تقارير فنية تحفظ تفاصيل الفحص.",
  },
] as const;

const FAQ = [
  {
    q: "هل أحتاج حساباً لاستعراض الورش؟",
    a: "لا. يمكنك تصفّح الورش وملفاتها العامة مباشرة. تحتاج إلى تسجيل الدخول عند طلب الفحص أو إدارة ورشتك.",
  },
  {
    q: "ماذا يتضمن التقرير الرقمي؟",
    a: "يعرض التقرير بنود الفحص والنتيجة والصور التي أضافها المفتش، ويمكن مشاركة النسخة المعتمدة منه.",
  },
  {
    q: "من يمكنه تسجيل الدخول؟",
    a: "مالكو المركبات المصرّح لهم، ومالكو الورش، والمفتشون، وفريق داسم.",
  },
] as const;

export function PublicHomeSections() {
  return (
    <>
      <section id="services" className="bg-[var(--inspection-ice)] px-4 py-16 sm:px-6 sm:py-20" dir="rtl">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold text-[var(--inspection-green-dark)]">رحلة بلا غموض</p>
            <h2 className="mt-2 text-balance text-3xl font-black tracking-[-0.025em] text-slate-950 sm:text-4xl">
              ثلاث خطوات. والنتيجة أمامك.
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-600">
              صممنا التجربة حول ما تحتاجه فعلًا: اختيار موثوق، متابعة سهلة، وتقرير واضح.
            </p>
          </div>

          <ol className="mt-9 grid gap-4 lg:grid-cols-3">
            {JOURNEY.map(({ icon: Icon, label, title, text }, index) => (
              <li key={title} className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_rgba(5,21,41,0.06)] sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0A2342] text-white shadow-md">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400">
                      <span className="text-[var(--inspection-green-dark)]">0{index + 1}</span>
                      <span>{label}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-[#0A2342] p-4 sm:grid-cols-3 sm:p-5">
            {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-4">
                <Icon className="h-6 w-6 shrink-0 text-[var(--inspection-accent)]" aria-hidden />
                <div>
                  <h3 className="text-sm font-extrabold text-white">{title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-white/55">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-4 py-16 sm:px-6 sm:py-20" dir="rtl">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
          <div>
            <p className="text-sm font-extrabold text-[var(--inspection-green-dark)]">قبل أن تبدأ</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.025em] text-slate-950">أسئلة سريعة</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
              معلومات مختصرة تساعدك على بدء الفحص دون خطوات زائدة.
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, index) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white open:shadow-[0_12px_30px_rgba(5,21,41,0.06)]" open={index === 0}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-extrabold text-slate-950 marker:content-none">
                  {item.q}
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xl font-medium text-slate-700 transition group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="support" className="bg-white px-4 pb-16 sm:px-6 sm:pb-20" dir="rtl">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 overflow-hidden rounded-[1.75rem] bg-[#0A2342] p-6 shadow-[0_24px_60px_rgba(5,21,41,0.15)] sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[var(--inspection-accent)]">
              <Headphones className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">تحتاج مساعدة قبل الحجز؟</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">فريق خدمة العملاء في منظومة داسم يساعدك في الاستفسارات التشغيلية.</p>
            </div>
          </div>
          <Link href="https://www.dasm.com.sa" className="inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-extrabold text-[#0A2342] transition hover:-translate-y-0.5 md:w-auto">
            تواصل عبر منصة داسم
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
