"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { assertInspectionRoles } from "@/lib/auth/access-layer.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { requireAdminClient } from "@/lib/supabase/admin";

export type WorkshopInviteActionResult =
  | { ok: true; token: string; applyUrl: string }
  | { ok: false; message: string };

export async function createWorkshopInviteFormAction(
  formData: FormData
): Promise<void> {
  await createWorkshopInviteAction(formData);
}

export async function createWorkshopInviteAction(
  formData: FormData
): Promise<WorkshopInviteActionResult> {
  try {
    await assertInspectionRoles(["super_admin", "inspection_admin"]);
  } catch {
    return { ok: false, message: "صلاحية إنشاء الدعوات غير متوفرة." };
  }

  const workshopName = String(formData.get("workshop_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const dasmUserId = String(formData.get("dasm_user_id") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const daysRaw = Number.parseInt(String(formData.get("expires_days") ?? "14"), 10);
  const expiresDays = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 14;

  if (!workshopName || !city) {
    return { ok: false, message: "اسم الورشة والمدينة مطلوبان للدعوة." };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);

  const sb = requireAdminClient();
  const actor = (await resolveDasmUserId()) ?? "inspection_admin";

  const { error } = await sb.from("inspection_workshop_invites").insert({
    token,
    workshop_name: workshopName,
    city,
    contact_name: contactName,
    phone,
    email,
    dasm_user_id: dasmUserId,
    notes,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    created_by: actor,
  });

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر إنشاء الدعوة." };
  }

  revalidatePath("/settings");

  const applyUrl = `/workshops/apply?invite=${token}`;
  return { ok: true, token, applyUrl };
}
