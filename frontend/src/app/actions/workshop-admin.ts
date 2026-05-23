"use server";

import { revalidatePath } from "next/cache";
import { assertInspectionRoles } from "@/lib/auth/access-layer.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { requireAdminClient } from "@/lib/supabase/admin";

export type WorkshopAdminActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function toggleWorkshopSuspensionFormAction(
  formData: FormData
): Promise<void> {
  await toggleWorkshopSuspensionAction(formData);
}

export async function toggleWorkshopSuspensionAction(
  formData: FormData
): Promise<WorkshopAdminActionResult> {
  try {
    await assertInspectionRoles(["super_admin", "inspection_admin"]);
  } catch {
    return { ok: false, message: "صلاحية إدارة الورش غير متوفرة." };
  }

  const workshopId = String(formData.get("workshop_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const reason = String(formData.get("suspension_reason") ?? "").trim() || null;

  if (!workshopId || (action !== "suspend" && action !== "restore")) {
    return { ok: false, message: "بيانات إجراء الورشة غير صالحة." };
  }
  if (action === "suspend" && !reason) {
    return { ok: false, message: "سبب الإيقاف مطلوب." };
  }

  const actor = (await resolveDasmUserId()) ?? "inspection_admin";
  const suspended = action === "suspend";
  const sb = requireAdminClient();
  const { error } = await sb
    .from("inspection_workshops")
    .update({
      is_suspended: suspended,
      suspended_at: suspended ? new Date().toISOString() : null,
      suspended_by: suspended ? actor : null,
      suspension_reason: suspended ? reason : null,
    })
    .eq("id", workshopId);

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر تحديث حالة الورشة." };
  }

  revalidatePath("/settings");
  revalidatePath("/workshops");
  revalidatePath("/workshop");

  return { ok: true };
}
