import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export type RepairRecommendationSeverity =
  | "advisory"
  | "minor"
  | "major"
  | "critical";

export type RepairRecommendationStatus =
  | "suggested"
  | "accepted"
  | "declined"
  | "completed";

export interface RepairRecommendation {
  id: string;
  requestId: string;
  reportId: string | null;
  title: string;
  description: string | null;
  severity: RepairRecommendationSeverity;
  estimatedCostSar: number | null;
  status: RepairRecommendationStatus;
  createdByRole: string | null;
  sortOrder: number;
  createdAt: string;
}

/** توصيات الإصلاح المرتبطة بطلب فحص، مرتّبة. */
export async function listRepairRecommendationsForRequest(
  requestId: string
): Promise<RepairRecommendation[]> {
  const key = requestId.trim();
  if (!key) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_repair_recommendations")
    .select("*")
    .eq("request_id", key)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    requestId: r.request_id as string,
    reportId: (r.report_id as string | null) ?? null,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    severity: r.severity as RepairRecommendationSeverity,
    estimatedCostSar:
      r.estimated_cost_sar != null ? Number(r.estimated_cost_sar) : null,
    status: r.status as RepairRecommendationStatus,
    createdByRole: (r.created_by_role as string | null) ?? null,
    sortOrder: (r.sort_order as number) ?? 0,
    createdAt: r.created_at as string,
  }));
}
