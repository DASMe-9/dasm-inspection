import "server-only";

import {
  getInspectorsForWorkshop,
  getWorkshop,
  listInspectionRequests,
} from "@/lib/data/inspection";
import { getWorkshopFollowerCount } from "@/lib/data/workshop-follows-data";
import {
  getWorkshopRatingAveragesMap,
  listApprovedWorkshopReviews,
} from "@/lib/data/workshop-reviews-data";

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

const OPEN_STATUSES = new Set([
  "submitted",
  "assigned",
  "dispatched",
  "on_site",
  "in_progress",
]);

export async function getWorkshopDashboardStats(
  workshopId: string
): Promise<WorkshopDashboardStats | null> {
  const workshop = await getWorkshop(workshopId);
  if (!workshop) return null;

  const [requests, inspectors, followers, reviews, ratingMap] =
    await Promise.all([
      listInspectionRequests({ workshopId }),
      getInspectorsForWorkshop(workshopId),
      getWorkshopFollowerCount(workshopId),
      listApprovedWorkshopReviews(workshopId),
      getWorkshopRatingAveragesMap(),
    ]);

  const rating = ratingMap.get(workshopId);

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
    teamSize: inspectors.length,
    followerCount: followers,
    reviewCount: reviews.length,
    averageRating: rating?.average ?? null,
    revenueSar,
    avgTurnaroundDays,
  };
}
