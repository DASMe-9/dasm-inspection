import { WorkshopAdminModerationPanel } from "@/components/inspection/WorkshopAdminModerationPanel";
import { WorkshopApplicationsPanel } from "@/components/inspection/WorkshopApplicationsPanel";
import { WorkshopInvitesPanel } from "@/components/inspection/WorkshopInvitesPanel";
import { WorkshopReviewModerationPanel } from "@/components/inspection/WorkshopReviewModerationPanel";
import { InspectionAccountPanel } from "@/components/account/InspectionAccountPanel";
import { SectionCard } from "@/components/shared";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WorkshopProfileHub } from "@/components/workshop/WorkshopProfileHub";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import { resolveWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { resolveInspectionShellContext } from "@/lib/auth/resolve-inspection-shell-context.server";
import { cookies, headers } from "next/headers";

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
  const accountProfile = await resolveInspectionShellContext();

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          حساب الفحص وتفضيلات هذه الخدمة
        </p>
      </div>

      <InspectionAccountPanel profile={accountProfile} />

      {workshopResolved ? (
        <WorkshopProfileHub
          workshopId={workshopResolved.workshopId}
          workshopSlug={workshopResolved.workshop.slug}
          workshop={workshopResolved.workshop}
          embeddedInSettings
        />
      ) : (
        <>
          <SectionCard title="مظهر التطبيق">
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

    </div>
  );
}
