import Link from "next/link";
import { cookies, headers } from "next/headers";
import { RequestCard } from "@/components/inspection";
import { EmptyState, SectionCard, StatCard } from "@/components/shared";
import {
  isWorkshopOperatorRole,
  parseWorkshopIdParam,
} from "@/lib/auth/workshop-dashboard";
import { getWorkshopDashboardAccess } from "@/lib/auth/workshop-dashboard.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import {
  listWorkshops,
} from "@/lib/data/inspection";
import { loadWorkshopDashboardBundle } from "@/lib/data/workshop-dashboard-data";
import { evaluateWorkshopKyc } from "@/lib/workshop-kyc";
import { WorkshopManageNav } from "@/components/workshop/WorkshopManageNav";
import { WalkInInspectionCard } from "@/components/workshop/WalkInInspectionCard";
import {
  Download,
  MapPin,
  CircleDollarSign,
  CalendarDays,
  Star,
  UserPlus,
  Users,
} from "lucide-react";

type PageProps = {
  searchParams: Promise<{ workshop_id?: string }>;
};

export default async function WorkshopDashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const headersList = await headers();
  const cookieStore = await cookies();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const overrideId = parseWorkshopIdParam(sp.workshop_id);
  const access = await getWorkshopDashboardAccess(personaCtx, {
    workshopIdOverride: overrideId,
  });

  if (!access.allowed) {
    return (
      <div dir="rtl">
        <SectionCard>
          <EmptyState
            title="لوحة الورشة غير متاحة"
            description={access.reason ?? "لا تملك صلاحية الوصول."}
            action={
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-[#1E74E8] hover:underline"
              >
                العودة للوحة العامة
              </Link>
            }
          />
        </SectionCard>
      </div>
    );
  }

  let workshopId = access.workshopId;

  if (
    !workshopId &&
    (access.persona === "inspection_admin" || access.persona === "super_admin")
  ) {
    const workshops = await listWorkshops();
    if (workshops.length === 0) {
      return (
        <SectionCard>
          <EmptyState
            title="لا ورش مسجّلة"
            description="أضف ورشة في النظام أولاً لعرض لوحة التشغيل."
          />
        </SectionCard>
      );
    }
    if (workshops.length === 1) {
      workshopId = workshops[0].id;
    } else {
      return (
        <div className="space-y-6" dir="rtl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">لوحة الورشة</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            اختر ورشة لعرض لوحة التشغيل (وضع الإدارة).
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {workshops.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/workshop?workshop_id=${w.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                >
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{w.name}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{w.city}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }

  if (!workshopId) {
    return (
      <SectionCard>
        <EmptyState
          title="لم تُحدَّد ورشة"
          description={
            access.reason ??
            "تعذّر تحديد الورشة المرتبطة بحسابك."
          }
        />
      </SectionCard>
    );
  }

  const bundle = await loadWorkshopDashboardBundle(workshopId, {
    includeInspectors: isWorkshopOperatorRole(access.persona),
  });
  if (!bundle) {
    return (
      <SectionCard>
        <EmptyState
          title="الورشة غير موجودة"
          description="تحقق من ربط الحساب بالورشة الصحيحة."
        />
      </SectionCard>
    );
  }

  const { workshop, stats, recent: recentSlice, inspectors: workshopInspectors } =
    bundle;

  const kyc = evaluateWorkshopKyc({
    ownerUserId: workshop.ownerUserId,
    commercialRegistration: workshop.commercialRegistration,
    bankIban: workshop.bankIban,
    bankBeneficiaryName: workshop.bankBeneficiaryName,
  });

  const manageQ = `?workshop_id=${workshopId}`;

  return (
    <div className="space-y-6" dir="rtl">
      <WorkshopManageNav />

      {!kyc.complete && isWorkshopOperatorRole(access.persona) && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">أكمل ملف الورشة والتحقق (KYC)</p>
          <p className="mt-1 text-xs">
            المتبقي: {kyc.missing.join(" · ")} —{" "}
            <Link
              href={`/settings${manageQ}#verification`}
              className="font-semibold underline"
            >
              انتقل إلى الإعدادات → التوثيق
            </Link>
          </p>
        </section>
      )}
      {isWorkshopOperatorRole(access.persona) ? (
        <WalkInInspectionCard
          workshopId={workshopId}
          inspectors={workshopInspectors}
        />
      ) : null}

      {stats && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard value={stats.openRequests} label="طلبات نشطة" />
          <StatCard value={stats.pendingReview} label="بانتظار المراجعة" />
          <StatCard value={stats.inProgress} label="قيد الفحص" />
          <StatCard value={stats.approvedTotal} label="فحوص معتمدة" />
        </section>
      )}

      {stats && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard
            value={`${stats.revenueSar.toLocaleString("en-US")} ر.س`}
            label="إيراد الفحوص المعتمدة"
          />
          <StatCard
            value={
              stats.avgTurnaroundDays != null
                ? `${stats.avgTurnaroundDays} يوم`
                : "—"
            }
            label="متوسط زمن الإنجاز"
          />
          <StatCard value={stats.teamSize} label="المفتشون" />
          <StatCard value={stats.followerCount} label="المتابعون" />
        </section>
      )}

      {stats && (
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            value={stats.averageRating ?? "—"}
            label={`تقييم (${stats.reviewCount})`}
          />
        </section>
      )}

      <SectionCard title="أحدث طلبات الورشة">
        {recentSlice.length === 0 ? (
          <EmptyState
            title="لا طلبات"
            description="ستظهر هنا الطلبات المرتبطة بهذه الورشة."
          />
        ) : (
          <div className="space-y-3">
            {recentSlice.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
            <Link
              href={`/requests?workshop=${workshopId}`}
              className="block text-center text-sm font-semibold text-[#1E74E8] hover:underline"
            >
              عرض كل الطلبات ({recent.length}) ←
            </Link>
          </div>
        )}
      </SectionCard>

      <SectionCard title="إدارة الورشة">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Link
              href={`/workshop/team${manageQ}`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-violet-50"
            >
              <Users className="h-4 w-4 text-violet-600" aria-hidden />
              إدارة الفريق
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/pricing${manageQ}`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-emerald-50"
            >
              <CircleDollarSign className="h-4 w-4 text-emerald-700" aria-hidden />
              أسعار الخدمة
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/areas${manageQ}`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-sky-100 bg-sky-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-sky-50"
            >
              <MapPin className="h-4 w-4 text-sky-700" aria-hidden />
              مناطق الخدمة
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/field${manageQ}`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-orange-50"
            >
              <CalendarDays className="h-4 w-4 text-orange-700" aria-hidden />
              تقويم وخريطة ميداني
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/reputation${manageQ}&tab=reviews`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-amber-50"
            >
              <Star className="h-4 w-4 text-amber-700" aria-hidden />
              التقييمات والمتابعون
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/reputation${manageQ}&tab=followers`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-indigo-50"
            >
              <UserPlus className="h-4 w-4 text-[#1857b8]" aria-hidden />
              قائمة المتابعين
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/export${manageQ}`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-gray-100"
            >
              <Download className="h-4 w-4 text-gray-700" aria-hidden />
              تصدير CSV
            </Link>
          </li>
          <li>
            <Link
              href={`/requests?workshop=${workshopId}&status=pending_review`}
              className="flex items-center gap-3 rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200 hover:bg-amber-50"
            >
              مراجعة التقارير المعلّقة
            </Link>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
