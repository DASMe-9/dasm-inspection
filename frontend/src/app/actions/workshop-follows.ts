"use server";

import { revalidatePath } from "next/cache";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { notifyWorkshopFollowers } from "@/lib/data/workshop-follows-data";
import { requireAdminClient } from "@/lib/supabase/admin";

export type FollowActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function followWorkshopAction(
  formData: FormData
): Promise<FollowActionResult> {
  const dasmUserId = await resolveDasmUserId();
  if (!dasmUserId) {
    return { ok: false, message: "سجّل الدخول لمتابعة الورشة." };
  }

  const workshopId = String(formData.get("workshop_id") ?? "").trim();
  const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();
  if (!workshopId) return { ok: false, message: "معرّف الورشة مطلوب." };

  const sb = requireAdminClient();
  const { error } = await sb.from("inspection_workshop_follows").insert({
    workshop_id: workshopId,
    dasm_user_id: dasmUserId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, message: error.message ?? "تعذّر المتابعة." };
  }

  if (workshopSlug) revalidatePath(`/workshops/${workshopSlug}`);
  revalidatePath("/my-inspections");
  return { ok: true };
}

export async function unfollowWorkshopAction(
  formData: FormData
): Promise<FollowActionResult> {
  const dasmUserId = await resolveDasmUserId();
  if (!dasmUserId) {
    return { ok: false, message: "سجّل الدخول لإلغاء المتابعة." };
  }

  const workshopId = String(formData.get("workshop_id") ?? "").trim();
  const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();
  if (!workshopId) return { ok: false, message: "معرّف الورشة مطلوب." };

  const sb = requireAdminClient();
  const { error } = await sb
    .from("inspection_workshop_follows")
    .delete()
    .eq("workshop_id", workshopId)
    .eq("dasm_user_id", dasmUserId);

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر إلغاء المتابعة." };
  }

  if (workshopSlug) revalidatePath(`/workshops/${workshopSlug}`);
  revalidatePath("/my-inspections");
  return { ok: true };
}

/** يُستدعى بعد اعتماد تقييم ورشة — إشعار المتابعين. */
export async function notifyFollowersNewApprovedReview(
  workshopId: string,
  workshopName: string
): Promise<void> {
  await notifyWorkshopFollowers(
    workshopId,
    `تقييم جديد — ${workshopName}`,
    "نُشر تقييم معتمد على صفحة الورشة.",
    "workshop_review_approved"
  );
}

export async function markNotificationReadAction(
  formData: FormData
): Promise<void> {
  const dasmUserId = await resolveDasmUserId();
  if (!dasmUserId) return;

  const notificationId = String(formData.get("notification_id") ?? "").trim();
  if (!notificationId) return;

  const sb = requireAdminClient();
  await sb
    .from("inspection_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("dasm_user_id", dasmUserId);

  revalidatePath("/my-inspections");
}
