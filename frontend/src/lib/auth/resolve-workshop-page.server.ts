import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { parseWorkshopIdParam } from "@/lib/auth/workshop-dashboard";
import { getWorkshopDashboardAccess } from "@/lib/auth/workshop-dashboard.server";
import { getWorkshop, listWorkshops } from "@/lib/data/inspection";
import type { Workshop } from "@/types";

export type ResolvedWorkshopPage = {
  workshop: Workshop;
  workshopId: string;
};

/** يحدّد ورشة لوحة التشغيل (نفس منطق `/workshop`). */
export async function resolveWorkshopPage(
  workshopIdParam?: string
): Promise<ResolvedWorkshopPage | null> {
  const headersList = await headers();
  const cookieStore = await cookies();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const overrideId = parseWorkshopIdParam(workshopIdParam);
  const access = await getWorkshopDashboardAccess(personaCtx, {
    workshopIdOverride: overrideId,
  });

  if (!access.allowed) return null;

  let workshopId = access.workshopId;

  if (
    !workshopId &&
    (access.persona === "inspection_admin" || access.persona === "super_admin")
  ) {
    const workshops = await listWorkshops();
    if (workshops.length === 1) {
      workshopId = workshops[0].id;
    } else {
      return null;
    }
  }

  if (!workshopId) return null;

  const workshop = await getWorkshop(workshopId);
  if (!workshop) return null;

  return { workshop, workshopId };
}

export async function requireWorkshopPage(
  workshopIdParam?: string
): Promise<ResolvedWorkshopPage> {
  const resolved = await resolveWorkshopPage(workshopIdParam);
  if (!resolved) {
    redirect("/workshop");
  }
  return resolved;
}
