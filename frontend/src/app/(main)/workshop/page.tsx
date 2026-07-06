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
  getWorkshop,
  listInspectionRequests,
  listWorkshops,
} from "@/lib/data/inspection";
import { getWorkshopDashboardStats } from "@/lib/data/workshop-dashboard-data";
import { WorkshopManageNav } from "@/components/workshop/WorkshopManageNav";
import {
  Building2,
  ClipboardList,
  Download,
  ExternalLink,
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
                className="text-sm font-semibold text-indigo-600 hover:underline"
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
          <h1 className="text-2xl font-bold text-gray-900">لوحة الورشة</h1>
          <p className="text-sm text-gray-600">
            اختر ورشة لعرض لوحة التشغيل (وضع الإدارة).
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {workshops.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/workshop?workshop_id=${w.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-violet-300"
                >
                  <p className="font-semibold text-gray-900">{w.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{w.city}</p>
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

  const workshop = await getWorkshop(workshopId);
  if (!workshop) {
    return (
      <SectionCard>
        <EmptyState
          title="الورشة غير موجودة"
          description="تحقق من ربط الحساب بالورشة الصحيحة."
        />
      </SectionCard>
    );
  }

  const [stats, recent] = await Promise.all([
    getWorkshopDashboardStats(workshopId),
    listInspectionRequests({ workshopId, sort: "updated_desc" }),
  ]);

  const recentSlice = recent.slice(0, 6);
  const manageQ = `?workshop_id=${workshopId}`;

  return (
    <div className="space-y-8" dir="rtl">
      <WorkshopManageNav />
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0B1E3A_0%,#12294a_100%)] p-6 shadow-md md:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1E74E8_0%,#2FBF4E_100%)]"
          aria-hidden
        />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-300">لوحة تشغيل الورشة</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
              <Building2 className="h-7 w-7 text-[#2FBF4E]" aria-hidden />
              {workshop.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300">{workshop.city}</p>
            {isWorkshopOperatorRole(access.persona) && (
              <p className="mt-2 text-xs text-slate-400">
                دورك:{" "}
                {access.persona === "workshop_owner" ? "مالك ورشة" : "مدير ورشة"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workshops/${workshop.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
            >
              الصفحة العامة
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={`/requests?workshop=${workshopId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1E74E8_0%,#2FBF4E_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              كل طلبات الورشة
            </Link>
          </div>
        </div>
      </section>

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
              className="block text-center text-sm font-semibold text-violet-700 hover:underline"
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
              className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-violet-50"
            >
              <Users className="h-4 w-4 text-violet-600" aria-hidden />
              إدارة الفريق
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/pricing${manageQ}`}
              className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-emerald-50"
            >
              <CircleDollarSign className="h-4 w-4 text-emerald-700" aria-hidden />
              أسعار الخدمة
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/areas${manageQ}`}
              className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-sky-50"
            >
              <MapPin className="h-4 w-4 text-sky-700" aria-hidden />
              مناطق الخدمة
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/field${manageQ}`}
              className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50"
            >
              <CalendarDays className="h-4 w-4 text-orange-700" aria-hidden />
              تقويم وخريطة ميداني
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/reviews${manageQ}`}
              className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-amber-50"
            >
              <Star className="h-4 w-4 text-amber-700" aria-hidden />
              تقييمات العملاء
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/followers${manageQ}`}
              className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-indigo-50"
            >
              <UserPlus className="h-4 w-4 text-indigo-700" aria-hidden />
              قائمة المتابعين
            </Link>
          </li>
          <li>
            <Link
              href={`/workshop/export${manageQ}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100"
            >
              <Download className="h-4 w-4 text-gray-700" aria-hidden />
              تصدير CSV
            </Link>
          </li>
          <li>
            <Link
              href={`/requests?workshop=${workshopId}&status=pending_review`}
              className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-amber-50"
            >
              مراجعة التقارير المعلّقة
            </Link>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
