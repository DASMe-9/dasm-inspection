import Link from "next/link";
import { redirect } from "next/navigation";
import { StatCard, SectionCard } from "@/components/shared";
import { RequestCard } from "@/components/inspection";
import {
  dashboardCountsFromLists,
  listInspectionRequests,
  listInspectionRequestsForDasmUser,
  listWorkshops,
} from "@/lib/data/inspection";
import { cookies, headers } from "next/headers";
import {
  resolveInspectionPersona,
  shouldScopeRequestsToPlatformUser,
} from "@/lib/auth/resolve-inspection-persona";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import { resolveWorkshopIdFromAuth } from "@/lib/auth/workshop-dashboard.server";

export default async function DashboardPage() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);

  if (isWorkshopOperatorRole(personaCtx.persona)) {
    const workshopId = await resolveWorkshopIdFromAuth();
    if (workshopId) {
      redirect("/workshop");
    }
  }

  const scoped = shouldScopeRequestsToPlatformUser(personaCtx);

  const workshops = await listWorkshops();
  const all = scoped
    ? await listInspectionRequestsForDasmUser(personaCtx.platformUserId!)
    : await listInspectionRequests();

  const kpi = dashboardCountsFromLists(all, workshops.length);

  const recent = [...all]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const subtitle =
    personaCtx.persona === "dasm_user"
      ? "نظرة على طلباتك المرتبطة بحساب منصّة داسم."
      : "إدارة طلبات الفحص والورش والتقارير — بيانات حية من قاعدة البيانات";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          لوحة تحكم الفحص الفني
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard value={kpi.openRequests} label="طلبات نشطة" />
        <StatCard value={kpi.pendingReview} label="بانتظار المراجعة" />
        <StatCard value={kpi.workshops} label="ورش معتمدة" />
        <StatCard value={kpi.closedSuccessful} label="فحوص مكتملة" />
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Link
          href="/requests"
          className="group bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm ring-1 ring-black/[0.04] hover:border-indigo-300/80 hover:shadow-md hover:ring-indigo-500/10 transition-all"
        >
          <span className="text-2xl mb-2 block">📋</span>
          <p className="font-semibold text-gray-900">طلبات الفحص</p>
          <p className="text-xs text-gray-500 mt-1">
            عرض وإدارة {all.length} طلب فحص
          </p>
        </Link>
        <Link
          href="/workshops"
          className="group bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm ring-1 ring-black/[0.04] hover:border-indigo-300/80 hover:shadow-md hover:ring-indigo-500/10 transition-all"
        >
          <span className="text-2xl mb-2 block">🔧</span>
          <p className="font-semibold text-gray-900">الورش المعتمدة</p>
          <p className="text-xs text-gray-500 mt-1">
            {workshops.length} ورشة مسجلة
          </p>
        </Link>
        <Link
          href="/settings"
          className="group bg-white border border-gray-200/90 rounded-2xl p-5 shadow-sm ring-1 ring-black/[0.04] hover:border-indigo-300/80 hover:shadow-md hover:ring-indigo-500/10 transition-all"
        >
          <span className="text-2xl mb-2 block">⚙️</span>
          <p className="font-semibold text-gray-900">الإعدادات</p>
          <p className="text-xs text-gray-500 mt-1">
            إعدادات النظام والأدوار
          </p>
        </Link>
      </section>

      {/* Recent Requests */}
      <SectionCard title="أحدث طلبات الفحص">
        <div className="space-y-3">
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-gray-500">لا توجد طلبات فحص بعد</p>
              <Link
                href="/requests"
                className="inline-block mt-3 text-sm text-[#1E74E8] font-medium hover:underline"
              >
                أنشئ أول طلب ←
              </Link>
            </div>
          ) : (
            <>
              {recent.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
              <Link
                href="/requests"
                className="block text-center text-sm font-medium py-2 text-[#1E74E8] hover:underline"
              >
                عرض كل الطلبات ({all.length}) ←
              </Link>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
