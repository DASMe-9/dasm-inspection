import Link from "next/link";
import { StatCard, SectionCard } from "@/components/shared";
import { RequestCard } from "@/components/inspection";
import { dashboardCounts, listInspectionRequests, listWorkshops } from "@/lib/data/inspection";

export default async function DashboardPage() {
  const kpi = await dashboardCounts();
  const all = await listInspectionRequests();
  const workshops = await listWorkshops();
  const recent = [...all]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الفحص الفني</h1>
        <p className="text-sm text-gray-500 mt-1">
          إدارة طلبات الفحص والورش والتقارير — بيانات حية من قاعدة البيانات
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={kpi.openRequests} label="طلبات نشطة" />
        <StatCard value={kpi.pendingReview} label="بانتظار المراجعة" />
        <StatCard value={kpi.workshops} label="ورش معتمدة" />
        <StatCard value={kpi.closedSuccessful} label="فحوص مكتملة" />
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/requests"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <span className="text-2xl mb-2 block">📋</span>
          <p className="font-semibold text-gray-900">طلبات الفحص</p>
          <p className="text-xs text-gray-500 mt-1">
            عرض وإدارة {all.length} طلب فحص
          </p>
        </Link>
        <Link
          href="/workshops"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <span className="text-2xl mb-2 block">🔧</span>
          <p className="font-semibold text-gray-900">الورش المعتمدة</p>
          <p className="text-xs text-gray-500 mt-1">
            {workshops.length} ورشة مسجلة
          </p>
        </Link>
        <Link
          href="/settings"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
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
                className="inline-block mt-3 text-sm text-indigo-600 font-medium hover:underline"
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
                className="block text-center text-sm font-medium py-2 text-indigo-600 hover:underline"
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
