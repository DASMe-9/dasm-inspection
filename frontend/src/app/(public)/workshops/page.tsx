import Link from "next/link";
import { WorkshopCard } from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { listWorkshopsForDirectory } from "@/lib/data/inspection";
import { getWorkshopRatingAveragesMap } from "@/lib/data/workshop-reviews-data";
import { PUBLIC_BRAND } from "@/components/public-site/brand-tokens";

export default async function WorkshopsPage() {
  const [list, ratingMap] = await Promise.all([
    listWorkshopsForDirectory(),
    getWorkshopRatingAveragesMap(),
  ]);
  const verified = list.filter((w) => w.isVerified).length;
  const cities = new Set(list.map((w) => w.city?.trim()).filter(Boolean)).size;

  const primary = PUBLIC_BRAND.navy;
  const accent = PUBLIC_BRAND.green;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 md:py-10" dir="rtl">
      <section
        className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-bl from-white via-[#F3F8FB] to-white px-5 py-8 shadow-[0_16px_45px_rgba(5,21,41,0.07)] md:px-10 md:py-10"
        aria-labelledby="workshops-hub-title"
      >
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: `linear-gradient(135deg, ${primary}44, ${accent}33)` }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: `linear-gradient(315deg, ${accent}44, transparent)` }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-extrabold text-[#178847]">شبكة داسم للفحص الفني</p>
            <h1
              id="workshops-hub-title"
              className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl"
            >
              الورش المعتمدة
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
              اكتشف شركاء الفحص المعتمدين من داسم، تابع حالة الاعتماد، واربط طلباتك بورشة موثوقة ضمن منظومة
              واحدة للمنصّة والمشتركين.
            </p>
          </div>
          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap md:justify-end">
            <Link
              href="/requests"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0A2342] px-4 text-sm font-bold text-white shadow-md transition hover:brightness-110"
            >
              طلب فحص جديد
            </Link>
            <Link
              href="/workshops/apply"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-4 text-sm font-bold shadow-sm transition hover:bg-emerald-50"
              style={{ borderColor: primary, color: primary }}
            >
              انضم كورشة شريكة
            </Link>
            <Link
              href="/subscription"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              اشتراك الورش
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
            title="لا توجد ورش متاحة حالياً"
            description="نعمل على تحديث قائمة الشركاء. حاول مرة أخرى لاحقاً أو تواصل مع خدمة العملاء."
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((w) => (
            <WorkshopCard
              key={w.id}
              workshop={w}
              rating={ratingMap.get(w.id) ?? null}
            />
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
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm ring-1 ring-violet-100/50">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold tabular-nums text-gray-900">{value}</dd>
      {hint && <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}
