import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { SectionCard } from "@/components/shared";
import { getInspectorsForWorkshop, getWorkshop } from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";

export default async function WorkshopDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const w = await getWorkshop(params.id);
  if (!w) notFound();

  const inspectors = await getInspectorsForWorkshop(w.id);
  const { primary, accent, secondary } = TOKENS.colors.roles.workshop;

  return (
    <div className="space-y-8" dir="rtl">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/workshops" className="font-medium transition hover:text-violet-700">
          الورش
        </Link>
        <span className="text-gray-300">/</span>
        <span className="truncate font-semibold text-gray-900">{w.name}</span>
      </nav>

      <section
        className="relative overflow-hidden rounded-3xl border border-violet-100/90 bg-gradient-to-bl from-white via-violet-50/40 to-white p-6 shadow-sm ring-1 ring-violet-100/70 md:p-8"
        aria-labelledby="workshop-title"
      >
        <div
          className="pointer-events-none absolute -left-24 top-0 h-40 w-40 rounded-full opacity-35 blur-3xl"
          style={{ background: `radial-gradient(circle, ${primary}55, transparent 70%)` }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-start gap-3">
              <span
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
              >
                <Building2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 id="workshop-title" className="text-2xl font-bold text-gray-900 md:text-3xl">
                  {w.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  {w.city}
                </p>
                {w.dasm_partner_ref && (
                  <p className="mt-2 truncate text-xs text-gray-500">{w.dasm_partner_ref}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {w.isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  معتمد في منظومة داسم
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
                  قيد اعتماد داسم
                </span>
              )}
              <span
                className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-medium ring-1 ring-gray-100"
                style={{ color: secondary }}
              >
                للمشتركين والورش الشريكة
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:flex-col md:items-stretch">
            <Link
              href="/requests"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              ربط طلب فحص بهذه الورشة
            </Link>
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-violet-50"
              style={{ borderColor: primary, color: primary }}
            >
              اشتراك وتفعيل للورش
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="جهات الاتصال">
          <ul className="space-y-4 text-sm">
            {w.phone && (
              <li className="flex gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"
                  aria-hidden
                >
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-500">هاتف</p>
                  <a href={`tel:${w.phone.replace(/\s+/g, "")}`} className="font-semibold text-gray-900 hover:text-violet-700">
                    {w.phone}
                  </a>
                </div>
              </li>
            )}
            {w.email && (
              <li className="flex gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"
                  aria-hidden
                >
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">بريد</p>
                  <a href={`mailto:${w.email}`} className="break-all font-semibold text-gray-900 hover:text-violet-700">
                    {w.email}
                  </a>
                </div>
              </li>
            )}
            <li className="flex gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600"
                aria-hidden
              >
                <BadgeCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-gray-500">حالة الاعتماد</p>
                <p className="font-semibold text-gray-900">{w.isVerified ? "معتمد" : "قيد المراجعة"}</p>
              </div>
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="المفتشون والفريق الميداني">
          {inspectors.length === 0 ? (
            <p className="text-sm text-gray-600">لا مفتشين مرتبطين بهذه الورشة حالياً.</p>
          ) : (
            <ul className="space-y-3">
              {inspectors.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-900">
                    <Users className="h-4 w-4 text-violet-600" aria-hidden />
                    {i.fullName}
                  </span>
                  {i.dasm_user_id && (
                    <span className="font-mono text-[10px] text-gray-500">{i.dasm_user_id}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 px-4 py-3 text-sm text-gray-700">
        <span>تصفّح كل الطلبات أو تابع حالة الفحص من لوحة الطلبات.</span>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1 font-semibold transition hover:opacity-90"
          style={{ color: primary }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          الذهاب إلى طلبات الفحص
        </Link>
      </div>
    </div>
  );
}
