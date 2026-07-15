import "server-only";

import {
  getInspectorsForWorkshop,
  getWorkshopBare,
  listInspectionRequests,
} from "@/lib/data/inspection";
import { getWorkshopFollowerCount } from "@/lib/data/workshop-follows-data";
import { getAdminClient } from "@/lib/supabase/admin";
import type { InspectionRequest, Inspector, Workshop } from "@/types";

export type WorkshopDashboardStats = {
  openRequests: number;
  pendingReview: number;
  inProgress: number;
  approvedTotal: number;
  teamSize: number;
  followerCount: number;
  reviewCount: number;
  averageRating: number | null;
  /** إجمالي أجور الطلبات المعتمدة (ريال) — من quotedFeeSar. */
  revenueSar: number;
  /** متوسط زمن الإنجاز بالأيام للطلبات المعتمدة (الإنشاء→آخر تحديث)؛ null إن لا معتمَد. */
  avgTurnaroundDays: number | null;
};

export type WorkshopDashboardBundle = {
  workshop: Workshop;
  stats: WorkshopDashboardStats;
  recent: InspectionRequest[];
  inspectors: Inspector[];
};

const OPEN_STATUSES = new Set([
  "submitted",
  "assigned",
  "dispatched",
  "on_site",
  "in_progress",
]);

/** متوسط وعدد التقييمات المعتمدة لورشة واحدة — بدون سحب كل تقييمات المنصة. */
async function getWorkshopRatingSummary(
  workshopId: string
): Promise<{ average: number | null; count: number }> {
  const sb = getAdminClient();
  if (!sb) return { average: null, count: 0 };

  const { data, error } = await sb
    .from("inspection_workshop_reviews")
    .select("rating")
    .eq("workshop_id", workshopId)
    .eq("status", "approved");

  if (error || !data || data.length === 0) {
    return { average: null, count: 0 };
  }

  const ratings = data.map((row) => Number(row.rating)).filter(Number.isFinite);
  if (ratings.length === 0) return { average: null, count: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}

function buildStatsFromRequests(
  requests: InspectionRequest[],
  extras: {
    teamSize: number;
    followerCount: number;
    reviewCount: number;
    averageRating: number | null;
  }
): WorkshopDashboardStats {
  const approved = requests.filter((r) => r.status === "approved");
  const revenueSar = approved.reduce(
    (sum, r) => sum + (typeof r.quotedFeeSar === "number" ? r.quotedFeeSar : 0),
    0
  );
  const DAY_MS = 1000 * 60 * 60 * 24;
  const turnarounds = approved
    .map((r) => {
      const start = Date.parse(r.createdAt);
      const end = Date.parse(r.updatedAt);
      return Number.isFinite(start) && Number.isFinite(end) && end >= start
        ? (end - start) / DAY_MS
        : null;
    })
    .filter((d): d is number => d !== null);
  const avgTurnaroundDays =
    turnarounds.length > 0
      ? Math.round(
          (turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10
        ) / 10
      : null;

  return {
    openRequests: requests.filter((r) => OPEN_STATUSES.has(r.status)).length,
    pendingReview: requests.filter((r) => r.status === "pending_review").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    approvedTotal: approved.length,
    teamSize: extras.teamSize,
    followerCount: extras.followerCount,
    reviewCount: extras.reviewCount,
    averageRating: extras.averageRating,
    revenueSar,
    avgTurnaroundDays,
  };
}

/**
 * حزمة واحدة للوحة الورشة: طلبات مرة واحدة → إحصاءات + أحدث 6،
 * مفتشون بفلتر الورشة، تقييمات الورشة فقط (لا خريطة كل المنصة).
 */
export async function loadWorkshopDashboardBundle(
  workshopId: string,
  options?: { includeInspectors?: boolean }
): Promise<WorkshopDashboardBundle | null> {
  const workshop = await getWorkshopBare(workshopId);
  if (!workshop) return null;

  const includeInspectors = options?.includeInspectors ?? true;

  const [requests, inspectors, followers, ratingSummary] = await Promise.all([
    listInspectionRequests({ workshopId, sort: "updated_desc" }),
    includeInspectors
      ? getInspectorsForWorkshop(workshopId)
      : Promise.resolve([] as Inspector[]),
    getWorkshopFollowerCount(workshopId),
    getWorkshopRatingSummary(workshopId),
  ]);

  const stats = buildStatsFromRequests(requests, {
    teamSize: inspectors.length,
    followerCount: followers,
    reviewCount: ratingSummary.count,
    averageRating: ratingSummary.average,
  });

  return {
    workshop,
    stats,
    recent: requests.slice(0, 6),
    inspectors,
  };
}

/** للتوافق مع الاستدعاءات القديمة — يفضّل loadWorkshopDashboardBundle. */
export async function getWorkshopDashboardStats(
  workshopId: string
): Promise<WorkshopDashboardStats | null> {
  const bundle = await loadWorkshopDashboardBundle(workshopId, {
    includeInspectors: true,
  });
  return bundle?.stats ?? null;
}
