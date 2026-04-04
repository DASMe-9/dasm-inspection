import "server-only";

import { getInspectionAuthContext } from "./inspection-context.server";

/**
 * طبقة وصول خادمية اختيارية لمراحل لاحقة.
 * لا تُستدعى من مسارات حالية افتراضياً حتى لا يُكسر الإنتاج.
 */
export async function requireInspectionAuthContext(): Promise<
  NonNullable<Awaited<ReturnType<typeof getInspectionAuthContext>>>
> {
  const ctx = await getInspectionAuthContext();
  if (!ctx) {
    throw new Error("INSPECTION_AUTH_REQUIRED");
  }
  return ctx;
}

export async function assertInspectionRoles(allowed: string[]): Promise<void> {
  if (process.env.DASM_JWT_ENFORCE !== "true") return;
  const ctx = await getInspectionAuthContext();
  if (!ctx) throw new Error("INSPECTION_AUTH_REQUIRED");
  const role = ctx.inspectionRole;
  if (!role || !allowed.includes(role)) {
    throw new Error("INSPECTION_FORBIDDEN");
  }
}
