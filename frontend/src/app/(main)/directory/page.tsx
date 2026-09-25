import { unstable_cache } from "next/cache";
import { WorkshopCard } from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { listWorkshopsForDirectory } from "@/lib/data/inspection";

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

  return (
    <div className="space-y-5" dir="rtl">
      <section
        className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:px-6"
        aria-labelledby="workshops-directory-title"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#1857b8]/90 dark:text-blue-300/90">
              شبكة DASM للفحص الفني
            </p>
            <h1
              id="workshops-directory-title"
              className="text-2xl font-bold leading-tight text-gray-900 dark:text-slate-100 md:text-3xl"
            >
              مراكز الفحص المعتمدة
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400 md:text-base">
              شركاء الفحص المعتمدون من DASM. قارن المراكز بالتقييمات الموثقة واربط طلبك بمركز ضمن منظومة
              واحدة.
            </p>
          </div>
        </div>

        {list.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatBox label="مراكز مسجّلة" value={String(list.length)} />
            <StatBox label="معتمدة DASM" value={String(verified)} />
            <StatBox label="مدن تغطية" value={String(cities || "—")} />
            <StatBox label="تحديث القائمة" value="مباشر" hint="من Supabase" />
          </dl>
        )}
      </section>

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="لا توجد مراكز فحص"
            description="طبّق الهجرة والبذور في Supabase (انظر supabase/migrations)."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((w) => (
            <WorkshopCard key={w.id} workshop={w} rating={w.ratingSummary} />
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
      <dt className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-bold tabular-nums text-gray-900 dark:text-slate-100">
        {value}
      </dd>
      {hint && <p className="mt-0.5 text-[10px] text-gray-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}
