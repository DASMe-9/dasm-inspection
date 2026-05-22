import type { AppRole } from "@/types";
import type { ResolvedInspectionPersona } from "@/lib/auth/resolve-inspection-persona";

export const WORKSHOP_DASHBOARD_ROLES: readonly AppRole[] = [
  "workshop_owner",
  "workshop_manager",
  "super_admin",
  "inspection_admin",
] as const;

const WORKSHOP_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isWorkshopDashboardRole(
  persona: ResolvedInspectionPersona["persona"]
): boolean {
  return (WORKSHOP_DASHBOARD_ROLES as readonly string[]).includes(persona);
}

export function isWorkshopOperatorRole(
  persona: ResolvedInspectionPersona["persona"]
): boolean {
  return persona === "workshop_owner" || persona === "workshop_manager";
}

export function parseWorkshopIdParam(raw: string | undefined): string | null {
  const v = raw?.trim();
  if (!v || !WORKSHOP_UUID_RE.test(v)) return null;
  return v;
}

export type WorkshopDashboardAccess = {
  allowed: boolean;
  workshopId: string | null;
  persona: ResolvedInspectionPersona["persona"];
  reason?: string;
};
