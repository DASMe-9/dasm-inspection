import Link from "next/link";
import { unstable_cache } from "next/cache";
import { WorkshopCard } from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { listWorkshopsForDirectory } from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";

/**
 * دليل الورش المعتمدة — داخل اللوحة (مجموعة (main)، القشرة الداكنة).
 *
 * نسخة داخلية لمستخدمي اللوحة بديلاً عن `/workshops` العام (مجموعة (public))؛
 * فتحُ الأخير من اللوحة كان يقفز عبر مقطع تخطيط آخر (force-dynamic) فيبطئ ~3ث
 * وقد يُظهر القشرة التسويقية للزائر. هنا لا قفزة مقاطع ولا قشرة تسويقية.
 * صفحة `/workshops` العامة تبقى كما هي للزوّار وSEO.
 */

// بيانات الدليل تتغيّر نادراً — نُخبّئها 60ث فيصبح الفتح فوريّاً (لا استعلام كل مرّة).
const getDirectory = unstable_cache(
  () => listWorkshopsForDirectory(),
  ["main-workshops-directory"],
  { revalidate: 60, tags: ["workshops-directory"] }
);

export default async function WorkshopsDirectoryPage() {
  const list = await getDirectory();
  const verified = list.filter((w) => w.isVerified).length;
  const cities = new Set(list.map((w) => w.city?.trim()).filter(Boolean)).size;

  const { primary, accent } = TOKENS.colors.roles.workshop;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 md:py-10" dir="rtl">
      <section
        className="relative overflow-hidden rounded-3xl border border-violet-100/90 bg-gradient-to-bl from-white via-violet-50/50 to-white px-5 py-8 shadow-sm ring-1 ring-violet-100/60 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 md:px-10 md:py-10"
        aria-labelledby="workshops-directory-title"
      >
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: `linear-gradient(135deg, ${primary}44, ${accent}33)` }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#1857b8]/90 dark:text-blue-300/90">
              شبكة داسم للفحص الفني
            </p>
            <h1
              id="workshops-directory-title"
              className="text-2xl font-bold leading-tight text-gray-900 dark:text-slate-100 md:text-3xl"
            >
              الورش المعتمدة
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400 md:text-base">
              شركاء الفحص المعتمدون من داسم — تصفّح الورش الموثوقة واربط طلباتك بورشة ضمن منظومة
              واحدة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Link
              href="/requests"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              طلب فحص جديد
            </Link>
          </div>
        </div>

        {list.length > 0 && (
          <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="ورش مسجّلة" value={String(list.length)} />
            <StatBox label="معتمدة داسم" value={String(verified)} />
            <StatBox label="مدن تغطية" value={String(cities || "—")} />
            <StatBox label="تحديث القائمة" value="مباشر" hint="من Supabase" />
          </dl>
        )}
      </section>

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="لا ورش"
            description="طبّق الهجرة والبذور في Supabase (انظر supabase/migrations)."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((w) => (
            <WorkshopCard key={w.id} workshop={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-violet-100/50 dark:border-slate-700/70 dark:bg-slate-800/60 dark:ring-slate-700/50">
      <dt className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-bold tabular-nums text-gray-900 dark:text-slate-100">
        {value}
      </dd>
      {hint && <p className="mt-0.5 text-[10px] text-gray-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}
