import "server-only";

import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import type { ResolvedInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { isWorkshopDashboardRole } from "@/lib/auth/workshop-dashboard";
import type { WorkshopSidebarProfileLink } from "@/lib/auth/workshop-sidebar-link";
import { findWorkshopByOwnerUserId } from "@/lib/data/workshop-owner-data";

export type { WorkshopSidebarProfileLink } from "@/lib/auth/workshop-sidebar-link";

/** رابط البروفايل العام للورشة في الشريط الجانبي (مالك/مدير ورشة فقط). */
export async function resolveWorkshopSidebarProfileLink(
  personaCtx: ResolvedInspectionPersona
): Promise<WorkshopSidebarProfileLink | null> {
  if (!isWorkshopDashboardRole(personaCtx.persona)) return null;

  const userId =
    personaCtx.platformUserId?.trim() || (await resolveDasmUserId());
  if (!userId) return null;

  const workshop = await findWorkshopByOwnerUserId(userId);
  if (!workshop?.slug?.trim()) return null;

  const q = `?workshop_id=${workshop.id}`;
  return {
    publicHref: `/workshops/${workshop.slug}`,
    name: workshop.name,
    profileHref: `/workshop/profile${q}`,
  };
}
