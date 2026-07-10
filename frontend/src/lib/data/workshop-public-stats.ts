import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export type WorkshopPublicInspectionRecord = {
  id: string;
  vehicleLabel: string;
  approvedAt: string;
  finalScore: number | null;
  harajPath: string | null;
};

export type WorkshopPublicStats = {
  approvedInspectionCount: number;
  recentInspections: WorkshopPublicInspectionRecord[];
};

/** سجل فحوص معتمدة للعرض العام (بدون بيانات حساسة). */
export async function getWorkshopPublicStats(
  workshopId: string
): Promise<WorkshopPublicStats> {
  const empty: WorkshopPublicStats = {
    approvedInspectionCount: 0,
    recentInspections: [],
  };

  const sb = getAdminClient();
  if (!sb) return empty;

  const { data: requests, error } = await sb
    .from("inspection_requests")
    .select("id, vehicle_label, updated_at, report_id")
    .eq("workshop_id", workshopId)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error || !requests?.length) return empty;

  const reportIds = requests
    .map((r) => r.report_id as string | null)
    .filter((id): id is string => Boolean(id));

  const reportMap = new Map<
    string,
    { final_score: number | null; haraj_track: string | null; approved_at: string | null }
  >();

  if (reportIds.length > 0) {
    const { data: reports } = await sb
      .from("inspection_reports")
      .select("id, final_score, haraj_track, approved_at")
      .in("id", reportIds);

    for (const row of reports ?? []) {
      reportMap.set(row.id as string, {
        final_score:
          row.final_score == null ? null : Number(row.final_score),
        haraj_track: (row.haraj_track as string | null) ?? null,
        approved_at: (row.approved_at as string | null) ?? null,
      });
    }
  }

  const recentInspections: WorkshopPublicInspectionRecord[] = requests
    .slice(0, 6)
    .map((r) => {
      const report = r.report_id
        ? reportMap.get(r.report_id as string)
        : undefined;
      return {
        id: r.id as string,
        vehicleLabel: (r.vehicle_label as string) || "مركبة",
        approvedAt:
          report?.approved_at ??
          (r.updated_at as string) ??
          new Date().toISOString(),
        finalScore: report?.final_score ?? null,
        harajPath: report?.haraj_track ?? null,
      };
    });

  const { count } = await sb
    .from("inspection_requests")
    .select("id", { count: "exact", head: true })
    .eq("workshop_id", workshopId)
    .eq("status", "approved");

  return {
    approvedInspectionCount: count ?? recentInspections.length,
    recentInspections,
  };
}
