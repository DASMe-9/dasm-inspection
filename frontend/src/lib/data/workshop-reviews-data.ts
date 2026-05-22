import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { WorkshopReview, WorkshopReviewModerationStatus } from "@/types";

type DbReview = {
  id: string;
  workshop_id: string;
  dasm_user_id: string;
  inspection_request_id: string;
  rating: number;
  comment: string | null;
  status: WorkshopReviewModerationStatus;
  rejection_reason: string | null;
  moderated_at: string | null;
  moderated_by: string | null;
  created_at: string;
};

function mapReview(row: DbReview): WorkshopReview {
  return {
    id: row.id,
    workshopId: row.workshop_id,
    dasmUserId: row.dasm_user_id,
    inspectionRequestId: row.inspection_request_id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    status: row.status,
    rejectionReason: row.rejection_reason ?? undefined,
    moderatedAt: row.moderated_at ?? undefined,
    moderatedBy: row.moderated_by ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getWorkshopRatingAveragesMap(): Promise<
  Map<string, { average: number; count: number }>
> {
  const sb = getAdminClient();
  const map = new Map<string, { average: number; count: number }>();
  if (!sb) return map;

  const { data, error } = await sb
    .from("inspection_workshop_reviews")
    .select("workshop_id, rating")
    .eq("status", "approved");

  if (error || !data) return map;

  const buckets = new Map<string, number[]>();
  for (const row of data) {
    const wid = row.workshop_id as string;
    const list = buckets.get(wid) ?? [];
    list.push(row.rating as number);
    buckets.set(wid, list);
  }

  for (const [wid, ratings] of Array.from(buckets.entries())) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    map.set(wid, {
      average: Math.round((sum / ratings.length) * 10) / 10,
      count: ratings.length,
    });
  }
  return map;
}

export async function listApprovedWorkshopReviews(
  workshopId: string
): Promise<WorkshopReview[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_workshop_reviews")
    .select("*")
    .eq("workshop_id", workshopId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map((r) => mapReview(r as DbReview));
}

export async function listPendingWorkshopReviews(): Promise<WorkshopReview[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_workshop_reviews")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error || !data) return [];
  return data.map((r) => mapReview(r as DbReview));
}

export type EligibleReviewRequest = {
  id: string;
  vehicleLabel: string;
  title: string;
};

/** طلبات معتمدة للمستخدم مع الورشة ولم يُقيَّم لها بعد. */
export async function listEligibleReviewRequests(
  dasmUserId: string,
  workshopId: string
): Promise<EligibleReviewRequest[]> {
  const sb = getAdminClient();
  if (!sb || !dasmUserId.trim()) return [];

  const { data: approved, error: reqErr } = await sb
    .from("inspection_requests")
    .select("id, vehicle_label, title")
    .eq("dasm_user_id", dasmUserId.trim())
    .eq("workshop_id", workshopId)
    .eq("status", "approved");

  if (reqErr || !approved?.length) return [];

  const { data: existing } = await sb
    .from("inspection_workshop_reviews")
    .select("inspection_request_id")
    .eq("dasm_user_id", dasmUserId.trim());

  const used = new Set(
    (existing ?? []).map((r) => r.inspection_request_id as string)
  );

  return approved
    .filter((r) => !used.has(r.id as string))
    .map((r) => ({
      id: r.id as string,
      vehicleLabel: r.vehicle_label as string,
      title: r.title as string,
    }));
}

export async function userAlreadyReviewedRequest(
  inspectionRequestId: string
): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) return false;
  const { data } = await sb
    .from("inspection_workshop_reviews")
    .select("id")
    .eq("inspection_request_id", inspectionRequestId)
    .maybeSingle();
  return Boolean(data);
}

export async function assertRequestEligibleForReview(
  dasmUserId: string,
  workshopId: string,
  inspectionRequestId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const sb = getAdminClient();
  if (!sb) return { ok: false, message: "قاعدة البيانات غير متاحة." };

  const { data: req, error } = await sb
    .from("inspection_requests")
    .select("id, status, workshop_id, dasm_user_id")
    .eq("id", inspectionRequestId)
    .maybeSingle();

  if (error || !req) {
    return { ok: false, message: "طلب الفحص غير موجود." };
  }
  if (req.status !== "approved") {
    return {
      ok: false,
      message: "التقييم متاح فقط بعد اعتماد تقرير الفحص.",
    };
  }
  if (req.workshop_id !== workshopId) {
    return { ok: false, message: "هذا الطلب لا يخص هذه الورشة." };
  }
  if (String(req.dasm_user_id ?? "") !== dasmUserId.trim()) {
    return { ok: false, message: "لا يمكنك تقييم طلب لا يخص حسابك." };
  }
  if (await userAlreadyReviewedRequest(inspectionRequestId)) {
    return { ok: false, message: "سبق أن أرسلت تقييماً لهذا الطلب." };
  }
  return { ok: true };
}
