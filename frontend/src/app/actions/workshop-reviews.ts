"use server";

import { revalidatePath } from "next/cache";
import { assertInspectionRoles } from "@/lib/auth/access-layer.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { requireAdminClient } from "@/lib/supabase/admin";
import {
  assertRequestEligibleForReview,
} from "@/lib/data/workshop-reviews-data";
import {
  isValidWorkshopRating,
  normalizeWorkshopReviewComment,
} from "@/lib/workshop-reviews";

export type WorkshopReviewActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitWorkshopReviewAction(
  formData: FormData
): Promise<WorkshopReviewActionResult> {
  const dasmUserId = await resolveDasmUserId();
  if (!dasmUserId) {
    return { ok: false, message: "سجّل الدخول عبر منصّة داسم لإرسال تقييم." };
  }

  const workshopId = String(formData.get("workshop_id") ?? "").trim();
  const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();
  const inspectionRequestId = String(
    formData.get("inspection_request_id") ?? ""
  ).trim();
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);
  const comment = normalizeWorkshopReviewComment(
    String(formData.get("comment") ?? "")
  );

  if (!workshopId || !inspectionRequestId) {
    return { ok: false, message: "بيانات التقييم ناقصة." };
  }
  if (!isValidWorkshopRating(rating)) {
    return { ok: false, message: "اختر تقييماً من 1 إلى 5." };
  }

  const eligible = await assertRequestEligibleForReview(
    dasmUserId,
    workshopId,
    inspectionRequestId
  );
  if (!eligible.ok) return eligible;

  const sb = requireAdminClient();
  const { error } = await sb.from("inspection_workshop_reviews").insert({
    workshop_id: workshopId,
    dasm_user_id: dasmUserId,
    inspection_request_id: inspectionRequestId,
    rating,
    comment,
    status: "pending",
  });

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر حفظ التقييم." };
  }

  if (workshopSlug) {
    revalidatePath(`/workshops/${workshopSlug}`);
  }
  revalidatePath("/settings");

  return { ok: true };
}

export async function moderateWorkshopReviewAction(
  formData: FormData
): Promise<WorkshopReviewActionResult> {
  try {
    await assertInspectionRoles(["super_admin", "inspection_admin"]);
  } catch {
    return { ok: false, message: "صلاحية المراجعة غير متوفرة." };
  }

  const reviewId = String(formData.get("review_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const rejectionReason =
    String(formData.get("rejection_reason") ?? "").trim() || null;

  if (!reviewId || (decision !== "approved" && decision !== "rejected")) {
    return { ok: false, message: "قرار المراجعة غير صالح." };
  }

  const moderator = (await resolveDasmUserId()) ?? "inspection_admin";

  const sb = requireAdminClient();
  const { data: existing, error: fetchErr } = await sb
    .from("inspection_workshop_reviews")
    .select("id, status, workshop_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchErr || !existing || existing.status !== "pending") {
    return { ok: false, message: "التقييم غير موجود أو مُعالَج مسبقاً." };
  }

  const { error } = await sb
    .from("inspection_workshop_reviews")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? rejectionReason : null,
      moderated_at: new Date().toISOString(),
      moderated_by: moderator,
    })
    .eq("id", reviewId);

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر تحديث التقييم." };
  }

  revalidatePath("/settings");
  revalidatePath("/workshops");

  return { ok: true };
}
