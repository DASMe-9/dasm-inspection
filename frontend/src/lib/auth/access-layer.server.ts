import "server-only";

import { getInspectionAuthContext } from "./inspection-context.server";

/**
 * طبقة وصول خادمية اختيارية لمراحل لاحقة.
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

/** أدوار يُسمح لها بتعديل بيانات الفحص عند وجود JWT في الرؤوس. */
const INSPECTION_MUTATION_APP_ROLES = [
  "super_admin",
  "inspection_admin",
  "workshop_manager",
  "workshop_owner",
  "mechanic",
  "inspector",
] as const;

/** أنماط حساب المنصّة الأم (مطاببات على مصفوفة dasm_roles في JWT أو inspection_role المعادل للإدارية). */
const DASM_PLATFORM_STAFF = [
  "super_admin",
  "admin",
  "moderator",
  "programmer",
] as const;

/**
 * عند تعطيل DASM_JWT_ENFORCE لا تفعل شيئاً — يُفترض حماية التشغيل عبر الشبكة (مفتاح خدمة فقط على الخادم).
 * عند التفعيل: يجب أن يثبت JWT + أن يملك المتصل دوراً تشغيلياً في الفحص أو موظفي المنصّة.
 */
export async function assertInspectionMutationAllowed(): Promise<void> {
  if (process.env.DASM_JWT_ENFORCE !== "true") return;

  const ctx = await getInspectionAuthContext();
  if (!ctx) throw new Error("INSPECTION_AUTH_REQUIRED");

  const inspectionRole = ctx.inspectionRole;
  if (inspectionRole && INSPECTION_MUTATION_APP_ROLES.includes(inspectionRole as (typeof INSPECTION_MUTATION_APP_ROLES)[number])) {
    return;
  }

  const elevated = [...ctx.dasmRoles];
  const hasStaff = elevated.some((r) =>
    DASM_PLATFORM_STAFF.includes(r as (typeof DASM_PLATFORM_STAFF)[number])
  );
  if (hasStaff) return;

  throw new Error("INSPECTION_FORBIDDEN");
}
