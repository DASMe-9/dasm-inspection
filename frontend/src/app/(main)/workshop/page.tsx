import Link from "next/link";
import { cookies, headers } from "next/headers";
import { EmptyState, SectionCard } from "@/components/shared";
import {
  isWorkshopOperatorRole,
  parseWorkshopIdParam,
} from "@/lib/auth/workshop-dashboard";
import { getWorkshopDashboardAccess } from "@/lib/auth/workshop-dashboard.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { listWorkshops } from "@/lib/data/inspection";
import {
  loadWorkshopDashboardBundle,
  toLocalWorkshopOperationsDashboard,
} from "@/lib/data/workshop-dashboard-data";
import { fetchWorkshopOperationsDashboard } from "@/lib/api/workshop-operations";
import { WorkshopManageNav } from "@/components/workshop/WorkshopManageNav";
import { WalkInInspectionCard } from "@/components/workshop/WalkInInspectionCard";
import { WorkshopOperationsCockpit } from "@/components/workshop/WorkshopOperationsCockpit";
import type { Inspector } from "@/types";

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            لوحة الورشة
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            اختر ورشة لعرض مركز القيادة التشغيلي.
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {workshops.map((workshop) => (
              <li key={workshop.id}>
                <Link
                  href={`/workshop?workshop_id=${workshop.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800"
                >
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    {workshop.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {workshop.city}
                  </p>
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
            access.reason ?? "تعذّر تحديد الورشة المرتبطة بحسابك."
          }
        />
      </SectionCard>
    );
  }

  const isWorkshopOperator = isWorkshopOperatorRole(access.persona);
  const token =
    cookieStore.get("dasm_access_token")?.value?.trim() ??
    cookieStore.get("inspection_token")?.value?.trim() ??
    "";

  let dashboard =
    isWorkshopOperator && token
      ? await fetchWorkshopOperationsDashboard(token)
      : null;

  if (dashboard?.workshop.id !== workshopId) {
    dashboard = null;
  }

  let workshopInspectors: Inspector[] = dashboard
    ? dashboard.inspectors.map((inspector) => ({
        id: inspector.id,
        fullName: inspector.name,
        workshopId,
        active: inspector.active,
      }))
    : [];

  if (!dashboard) {
    const bundle = await loadWorkshopDashboardBundle(workshopId, {
      includeInspectors: isWorkshopOperator,
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

    dashboard = toLocalWorkshopOperationsDashboard(bundle);
    workshopInspectors = bundle.inspectors;
  }

  return (
    <div className="space-y-5" dir="rtl">
      <WorkshopManageNav />
      <WorkshopOperationsCockpit
        dashboard={dashboard}
        canReceiveWalkIn={isWorkshopOperator}
      />

      {isWorkshopOperator ? (
        <div id="walk-in-inspection" className="scroll-mt-24">
          <WalkInInspectionCard
            workshopId={workshopId}
            inspectors={workshopInspectors}
          />
        </div>
      ) : null}
    </div>
  );
}
