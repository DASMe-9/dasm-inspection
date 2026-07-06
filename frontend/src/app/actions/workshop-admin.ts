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

/** يبني slug فريداً من اسم الورشة (لاتيني) مع لاحقة من معرّف الطلب لضمان التفرّد. */
function buildWorkshopSlug(name: string, applicationId: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workshop";
  return `${base}-${applicationId.slice(0, 8)}`;
}

export async function approveWorkshopApplicationFormAction(
  formData: FormData
): Promise<void> {
  await approveWorkshopApplicationAction(formData);
}

export async function rejectWorkshopApplicationFormAction(
  formData: FormData
): Promise<void> {
  await rejectWorkshopApplicationAction(formData);
}

/** اعتماد طلب انضمام ورشة: إنشاء ورشة معتمدة من بيانات الطلب ثم وسم الطلب approved. */
export async function approveWorkshopApplicationAction(
  formData: FormData
): Promise<WorkshopAdminActionResult> {
  try {
    await assertInspectionRoles(["super_admin", "inspection_admin"]);
  } catch {
    return { ok: false, message: "صلاحية اعتماد الورش غير متوفرة." };
  }

  const applicationId = String(formData.get("application_id") ?? "").trim();
  if (!applicationId) {
    return { ok: false, message: "معرّف الطلب مطلوب." };
  }

  const sb = requireAdminClient();

  const { data: app, error: appError } = await sb
    .from("inspection_workshop_applications")
    .select("id, workshop_name, city, phone, email, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (appError) {
    return { ok: false, message: appError.message ?? "تعذّر قراءة الطلب." };
  }
  if (!app) {
    return { ok: false, message: "الطلب غير موجود." };
  }
  if (app.status === "approved") {
    return { ok: false, message: "الطلب معتمد مسبقاً." };
  }

  const { error: insertError } = await sb.from("inspection_workshops").insert({
    name: app.workshop_name,
    city: app.city,
    phone: app.phone ?? null,
    email: app.email ?? null,
    is_verified: true,
    slug: buildWorkshopSlug(String(app.workshop_name), applicationId),
  });

  if (insertError) {
    return {
      ok: false,
      message: insertError.message ?? "تعذّر إنشاء الورشة من الطلب.",
    };
  }

  const { error: statusError } = await sb
    .from("inspection_workshop_applications")
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (statusError) {
    // الورشة أُنشئت؛ فشل وسم الطلب فقط — أبلغ دون إيهام بالفشل الكامل.
    return {
      ok: false,
      message: "أُنشئت الورشة لكن تعذّر تحديث حالة الطلب: " + statusError.message,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/workshops");

  return { ok: true };
}

/** رفض طلب انضمام ورشة (وسم الطلب rejected دون إنشاء ورشة). */
export async function rejectWorkshopApplicationAction(
  formData: FormData
): Promise<WorkshopAdminActionResult> {
  try {
    await assertInspectionRoles(["super_admin", "inspection_admin"]);
  } catch {
    return { ok: false, message: "صلاحية رفض الطلبات غير متوفرة." };
  }

  const applicationId = String(formData.get("application_id") ?? "").trim();
  if (!applicationId) {
    return { ok: false, message: "معرّف الطلب مطلوب." };
  }

  const sb = requireAdminClient();
  const { error } = await sb
    .from("inspection_workshop_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر رفض الطلب." };
  }

  revalidatePath("/settings");
  return { ok: true };
}
