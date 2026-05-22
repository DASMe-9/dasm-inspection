import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { WorkshopFollower } from "@/types/workshop-insights";
import type { WorkshopReview } from "@/types";

type DbReview = {
  id: string;
  workshop_id: string;
  dasm_user_id: string;
  inspection_request_id: string;
  rating: number;
  comment: string | null;
  status: WorkshopReview["status"];
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

/** كل تقييمات الورشة (للمالك — قراءة فقط). */
export async function listWorkshopReviewsForOwner(
  workshopId: string,
  limit = 200
): Promise<WorkshopReview[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_workshop_reviews")
    .select("*")
    .eq("workshop_id", workshopId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => mapReview(r as DbReview));
}

export async function listWorkshopFollowers(
  workshopId: string,
  limit = 500
): Promise<WorkshopFollower[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_workshop_follows")
    .select("id, dasm_user_id, created_at")
    .eq("workshop_id", workshopId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    dasmUserId: row.dasm_user_id as string,
    createdAt: row.created_at as string,
  }));
}
