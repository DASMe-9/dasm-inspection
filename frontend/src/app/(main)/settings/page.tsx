import { WorkshopAdminModerationPanel } from "@/components/inspection/WorkshopAdminModerationPanel";
import { WorkshopApplicationsPanel } from "@/components/inspection/WorkshopApplicationsPanel";
import { WorkshopInvitesPanel } from "@/components/inspection/WorkshopInvitesPanel";
import { WorkshopReviewModerationPanel } from "@/components/inspection/WorkshopReviewModerationPanel";
import { SectionCard } from "@/components/shared";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WorkshopProfileHub } from "@/components/workshop/WorkshopProfileHub";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import { resolveWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import type { AppRole } from "@/types";
import { cookies, headers } from "next/headers";

const ROLES: { id: AppRole; label: string }[] = [
  { id: "super_admin", label: "مشرف عام" },
  { id: "inspection_admin", label: "إدارة الفحص" },
  { id: "workshop_manager", label: "مدير ورشة" },
  { id: "inspector", label: "مفتش" },
  { id: "viewer", label: "عرض فقط" },
];

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ctx = await getInspectionAuthContext();
  const headersList = await headers();
  const cookieStore = await cookies();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const isWorkshopOp = isWorkshopOperatorRole(personaCtx.persona);

  const canModerate =
    ctx?.inspectionRole === "inspection_admin" ||
    ctx?.inspectionRole === "super_admin" ||
    ctx?.dasmRoles.some((r) =>
      ["super_admin", "admin", "moderator"].includes(r)
    );

  const workshopResolved = isWorkshopOp
    ? await resolveWorkshopPage(sp.workshop_id)
    : null;

  return (
    <div className="space-y-6" dir="rtl">
      {workshopResolved ? (
        <WorkshopProfileHub
          workshopId={workshopResolved.workshopId}
          workshopSlug={workshopResolved.workshop.slug}
          workshop={workshopResolved.workshop}
          embeddedInSettings
        />
      ) : (
        <>
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
            الإعدادات
          </h2>
          <SectionCard title="المظهر">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700 dark:text-slate-300">
                الوضع الداكن / الفاتح
              </span>
              <ThemeToggle className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700" />
            </div>
          </SectionCard>
        </>
      )}

      {canModerate && (
        <>
          <WorkshopApplicationsPanel />
          <WorkshopInvitesPanel />
          <WorkshopReviewModerationPanel />
          <WorkshopAdminModerationPanel />
        </>
      )}

      {!isWorkshopOp && (
        <>
          <SectionCard title="الأدوار (V1)">
            <ul className="text-sm space-y-2">
              {ROLES.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span>{r.label}</span>
                  <code className="text-xs text-gray-500">{r.id}</code>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              الصلاحيات الفعلية تُفرض عبر DASM / JWT عند الربط.
            </p>
          </SectionCard>

          <SectionCard title="التكامل">
            <p className="text-sm text-gray-600">
              هذا التطبيق مستقل في الريبو ويستهلك معرفات DASM (
              <code className="text-xs">dasm_car_id</code>،{" "}
              <code className="text-xs">dasm_user_id</code>
              ). راجع <code className="text-xs">docs/DASM_INTEGRATION.md</code>.
            </p>
          </SectionCard>
        </>
      )}
    </div>
  );
}
