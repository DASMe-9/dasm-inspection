import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared";
import {
  resolveInspectionPersona,
  visibleNavKeys,
} from "@/lib/auth/resolve-inspection-persona";
import { applyHiddenNavKeys } from "@/lib/auth/workshop-nav-preferences";
import { resolveInspectionShellContext } from "@/lib/auth/resolve-inspection-shell-context.server";
import { resolveWorkshopIdFromAuth } from "@/lib/auth/workshop-dashboard.server";
import { isWorkshopDashboardRole } from "@/lib/auth/workshop-dashboard";
import { getWorkshopHiddenNavKeys } from "@/lib/data/workshop-nav-preferences-data";
import { findWorkshopIdByOwnerUserId } from "@/lib/data/workshop-owner-data";
import { isSupabaseConfigured } from "@/lib/data/inspection";

export const dynamic = "force-dynamic";

export default async function MainShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // حماية: تحقق من وجود توكن DASM قبل عرض أي صفحة محمية
  const cookieStore = await cookies();
  const token =
    cookieStore.get("dasm_access_token")?.value ??
    cookieStore.get("inspection_token")?.value;

  if (!token) {
    redirect("/");
  }

  const configured = await isSupabaseConfigured();

  const headersList = await headers();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  let allowedNavKeys = visibleNavKeys(personaCtx.persona);

  if (isWorkshopDashboardRole(personaCtx.persona)) {
    let workshopId = await resolveWorkshopIdFromAuth();
    if (!workshopId && personaCtx.platformUserId) {
      workshopId = await findWorkshopIdByOwnerUserId(personaCtx.platformUserId);
    }
    if (workshopId) {
      const hidden = await getWorkshopHiddenNavKeys(workshopId);
      allowedNavKeys = applyHiddenNavKeys(allowedNavKeys, hidden);
    }
  }

  const shellContext = await resolveInspectionShellContext();

  return (
    <AppShell
      allowedNavKeys={Array.from(allowedNavKeys)}
      configured={configured}
      shellContext={shellContext}
    >
      {children}
    </AppShell>
  );
}
