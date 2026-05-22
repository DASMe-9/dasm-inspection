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

  return {
    openRequests: requests.filter((r) => OPEN_STATUSES.has(r.status)).length,
    pendingReview: requests.filter((r) => r.status === "pending_review").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    approvedTotal: requests.filter((r) => r.status === "approved").length,
    teamSize: inspectors.length,
    followerCount: followers,
    reviewCount: reviews.length,
    averageRating: rating?.average ?? null,
  };
}
