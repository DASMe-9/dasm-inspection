import Link from "next/link";
import { StatCard, SectionCard } from "@/components/shared";
import { RequestCard } from "@/components/inspection";
import { dashboardCounts, listInspectionRequests } from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";

export default async function DashboardPage() {
  const kpi = await dashboardCounts();
  const all = await listInspectionRequests();
  const recent = [...all]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3);

  return (
    <div className="space-y-6" dir="rtl">
      <p className="text-sm text-gray-600">
        لوحة تحكم فحص السيارات والورش — بيانات حية من Supabase؛ مراجع DASM (
        <code className="text-xs">dasm_car_id</code> /{" "}
        <code className="text-xs">dasm_user_id</code>).
      </p>

      <section className="grid grid-cols-2 gap-3">
        <StatCard value={kpi.openRequests} label="طلبات نشطة" />
        <StatCard value={kpi.pendingReview} label="بانتظار المراجعة" />
        <StatCard value={kpi.workshops} label="ورش معتمدة" />
        <StatCard value={kpi.closedSuccessful} label="فحوص مكتملة (معتمدة)" />
      </section>

      <SectionCard title="أحدث طلبات الفحص">
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">
              لا طلبات بعد. أنشئ طلباً من صفحة الطلبات.
            </p>
          ) : (
            recent.map((r) => <RequestCard key={r.id} request={r} />)
          )}
          <Link
            href="/requests"
            className="block text-center text-sm font-medium py-2"
            style={{ color: TOKENS.colors.roles.workshop.primary }}
          >
            عرض كل الطلبات ←
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
