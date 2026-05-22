import "server-only";

import { assertInspectionMutationAllowed } from "@/lib/auth/access-layer.server";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";

const OPERATOR_ROLES = ["workshop_owner", "workshop_manager"] as const;
const ADMIN_ROLES = ["super_admin", "inspection_admin"] as const;

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
  if (
    role &&
    OPERATOR_ROLES.includes(role as (typeof OPERATOR_ROLES)[number]) &&
    ctx.workshopId === workshopId
  ) {
    return;
  }

  throw new Error("INSPECTION_FORBIDDEN");
}
