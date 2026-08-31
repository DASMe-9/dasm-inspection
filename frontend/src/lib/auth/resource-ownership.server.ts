import "server-only";

import { cookies, headers } from "next/headers";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { resolveWorkshopIdFromAuth } from "@/lib/auth/workshop-dashboard.server";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";

export type OwnedInspectionResource = {
  workshopId?: string | null;
  inspectorId?: string | null;
  dasmUserId?: string | null;
};

/**
 * Single-resource ownership gate for a request/report, mirroring the same
 * persona → scope mapping `resolveRequestListScope()` already applies to the
 * requests *list* — this is the equivalent for a single fetched row, which
 * had no equivalent anywhere in this codebase (`getInspectionRequest()` and
 * `getReport()` both fetch by id alone via the service-role client, with no
 * ownership check at all — any authenticated user could view any report or
 * request by guessing/incrementing its id).
 *
 * Only the JWT-verified context (`getInspectionAuthContext()`) is trusted for
 * the actual match values, same as the list scope — the gateway-cookie
 * persona is used only to pick which branch applies, never as the value
 * being compared, per `resolveInspectionPersona()`'s own documented trust
 * boundary ("ليست للاستخدام في التخويل الحسّاس").
 *
 * When `DASM_JWT_ENFORCE` is off, `getInspectionAuthContext()` returns null
 * and this returns `true` — unchanged current platform-wide behavior
 * (service-role access, no scoping anywhere), not a new gate.
 */
export async function canAccessInspectionResource(
  resource: OwnedInspectionResource
): Promise<boolean> {
  const authCtx = await getInspectionAuthContext();
  if (!authCtx) return true;

  const persona = resolveInspectionPersona(await headers(), await cookies());

  if (persona.persona === "inspection_admin" || persona.persona === "super_admin") {
    return true;
  }

  if (isWorkshopOperatorRole(persona.persona)) {
    const authWorkshopId = authCtx.workshopId?.trim() ?? (await resolveWorkshopIdFromAuth());
    return Boolean(authWorkshopId) && resource.workshopId === authWorkshopId;
  }

  if (persona.persona === "inspector" || persona.persona === "mechanic") {
    const authInspectorRecordId = authCtx.inspectorRecordId?.trim() || null;
    return Boolean(authInspectorRecordId) && resource.inspectorId === authInspectorRecordId;
  }

  if (persona.persona === "dasm_user") {
    return Boolean(authCtx.userId) && resource.dasmUserId === authCtx.userId;
  }

  // Unknown/unhandled persona: closed by default.
  return false;
}
