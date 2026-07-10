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
    .slice(0, 5);

  const heroEyebrow = isCustomer
    ? "منصّة داسم للفحص الفني"
    : isInspector
      ? "غرفة عمليات الفحص"
      : "لوحة التحكم";

  const heroTitle = isCustomer
    ? "مركباتي وطلباتي"
    : isInspector
      ? "مهام الفحص اليوم"
      : "لوحة تحكم الفحص الفني";

  const heroDescription = isCustomer
    ? "تابع طلبات الفحص، رصيد المحفظة، والملف الفني لمركباتك — ضمن منظومة داسم الموحّدة."
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
            label: isCustomer ? "ورش معتمدة" : "إجمالي الطلبات",
            value: isCustomer ? String(kpi.workshops) : String(all.length),
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {isCustomer ? (
          <>
            <QuickActionCard
              href="/requests"
              title="طلب فحص جديد"
              description={`${all.length} طلب مرتبط بحسابك`}
              icon={ClipboardList}
              accent="blue"
            />
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
              title="الورش المعتمدة"
              description={`${workshops.length} ورشة في الشبكة`}
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
              title="الورش المعتمدة"
              description={`${workshops.length} ورشة مسجّلة`}
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
                  ? "ابدأ بطلب فحص لمركبتك من الورش المعتمدة في شبكة داسم."
                  : "ستظهر الطلبات هنا عند إنشائها أو إسنادها."
              }
              action={
                <Link
                  href="/requests"
                  className="inline-flex min-h-[44px] items-center rounded-xl bg-[#1E74E8] px-5 text-sm font-semibold text-white hover:bg-[#1857b8]"
                >
                  {isCustomer ? "إنشاء طلب فحص" : "عرض الطلبات"}
                </Link>
              }
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
