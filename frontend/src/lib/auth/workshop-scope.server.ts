import "server-only";

import { assertInspectionMutationAllowed } from "@/lib/auth/access-layer.server";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { findWorkshopIdByOwnerUserId } from "@/lib/data/workshop-owner-data";

const OPERATOR_ROLES = ["workshop_owner", "workshop_manager"] as const;
const ADMIN_ROLES = ["super_admin", "inspection_admin"] as const;

async function resolveOperatorWorkshopId(
  ctx: NonNullable<Awaited<ReturnType<typeof getInspectionAuthContext>>>
): Promise<string | null> {
  if (ctx.workshopId?.trim()) return ctx.workshopId.trim();
  const userId = ctx.userId?.trim() || (await resolveDasmUserId());
  if (!userId) return null;
  return findWorkshopIdByOwnerUserId(userId);
}

export async function assertWorkshopManageAccess(
  workshopId: string
): Promise<void> {
  await assertInspectionMutationAllowed();

  if (process.env.DASM_JWT_ENFORCE !== "true") return;

  const ctx = await getInspectionAuthContext();
  if (!ctx) throw new Error("INSPECTION_AUTH_REQUIRED");

  const role = ctx.inspectionRole;
  if (role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
    return;
  }
  if (role && OPERATOR_ROLES.includes(role as (typeof OPERATOR_ROLES)[number])) {
    const ownedWorkshopId = await resolveOperatorWorkshopId(ctx);
    if (ownedWorkshopId === workshopId) return;
  }

  throw new Error("INSPECTION_FORBIDDEN");
}
