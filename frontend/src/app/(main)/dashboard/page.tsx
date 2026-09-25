import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Car,
  Wallet,
  Wrench,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import {
  PersonaPageHero,
  QuickActionCard,
  SectionCard,
  EmptyState,
} from "@/components/shared";
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

const INSPECTOR_PERSONAS = new Set([
  "inspector",
  "mechanic",
  "viewer",
  "inspection_admin",
  "super_admin",
]);

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
  const isCustomer = personaCtx.persona === "dasm_user";
  const isInspector = INSPECTOR_PERSONAS.has(personaCtx.persona);

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
    .slice(0, 3);

  const heroEyebrow = isCustomer
    ? "فحص DASM"
    : isInspector
      ? "غرفة عمليات الفحص"
      : "نظرة عامة";

  const heroTitle = isCustomer
    ? "ملخص الفحص"
    : isInspector
      ? "مهام الفحص اليوم"
      : "نظرة عامة على الفحص الفني";

  const heroDescription = isCustomer
    ? "تابع حالة مركباتك ونتائج الفحص من حساب DASM الموحّد."
    : isInspector
      ? "قائمة الطلبات المُسندة إليك والجاهزة للتنفيذ الميداني أو في الورشة."
      : "إدارة طلبات الفحص والورش والتقارير — بيانات حية من قاعدة البيانات.";

  const heroVariant = isCustomer ? "customer" : isInspector ? "inspector" : "neutral";

  const heroActions = isCustomer
    ? [
        { href: "/requests", label: "طلب فحص جديد", primary: true },
        { href: "/my-inspections", label: "طلباتي" },
      ]
    : isInspector
      ? [
          { href: "/requests", label: "قائمة المهام", primary: true },
          { href: "/directory", label: "دليل الورش" },
        ]
      : [{ href: "/requests", label: "طلبات الفحص", primary: true }];

  const heroIcon = isCustomer ? Car : isInspector ? ClipboardList : LayoutDashboard;

  return (
    <div className="space-y-6 md:space-y-8" dir="rtl">
      <PersonaPageHero
        variant={heroVariant}
        eyebrow={heroEyebrow}
        title={heroTitle}
        description={heroDescription}
        icon={heroIcon}
        actions={heroActions}
        stats={[
          { label: "طلبات نشطة", value: String(kpi.openRequests) },
          { label: "بانتظار المراجعة", value: String(kpi.pendingReview) },
          { label: "فحوص مكتملة", value: String(kpi.closedSuccessful) },
          {
            label: isCustomer ? "مراكز معتمدة" : "إجمالي الطلبات",
            value: isCustomer ? String(kpi.workshops) : String(all.length),
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {isCustomer ? (
          <>
            <QuickActionCard
              href="/my-inspections"
              title="طلباتي ومركباتي"
              description="الملف الفني والتذكيرات"
              icon={Car}
              accent="emerald"
            />
            <QuickActionCard
              href="/wallet"
              title="محفظتي"
              description="رصيد مسبق الدفع للفحوصات"
              icon={Wallet}
              accent="violet"
            />
            <QuickActionCard
              href="/directory"
              title="مراكز الفحص"
              description={`${workshops.length} مركز في الشبكة`}
              icon={Wrench}
              accent="slate"
            />
          </>
        ) : (
          <>
            <QuickActionCard
              href="/requests"
              title="طلبات الفحص"
              description={`${all.length} طلب في النظام`}
              icon={ClipboardList}
              accent="blue"
            />
            <QuickActionCard
              href="/directory"
              title="مراكز الفحص"
              description={`${workshops.length} مركز مسجّل`}
              icon={Wrench}
              accent="emerald"
            />
            <QuickActionCard
              href="/settings"
              title="الإعدادات"
              description="الأدوار والتفضيلات"
              icon={Settings}
              accent="slate"
            />
          </>
        )}
      </section>

      <SectionCard title="أحدث طلبات الفحص">
        <div className="space-y-3">
          {recent.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات فحص بعد"
              description={
                isCustomer
                  ? "ابدأ من الزر الرئيسي أعلاه لاختيار مركز الفحص المناسب."
                  : "ستظهر الطلبات هنا عند إنشائها أو إسنادها."
              }
              action={isCustomer ? undefined : <Link href="/requests" className="text-sm font-semibold text-[#1E74E8] hover:underline">عرض الطلبات</Link>}
            />
          ) : (
            <>
              {recent.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
              <Link
                href="/requests"
                className="block py-2 text-center text-sm font-medium text-[#1E74E8] hover:underline"
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
