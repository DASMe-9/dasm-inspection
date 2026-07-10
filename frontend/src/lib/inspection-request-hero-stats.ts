import type { InspectionRequest } from "@/types";
import { dashboardCountsFromLists } from "@/lib/data/inspection";

const IN_PROGRESS_STATUSES = new Set([
  "assigned",
  "dispatched",
  "on_site",
  "in_progress",
]);

export function requestListHeroStats(requests: InspectionRequest[]) {
  const base = dashboardCountsFromLists(requests, 0);
  const fieldCount = requests.filter((r) => r.serviceMode === "field").length;

  return {
    active: base.openRequests,
    pendingReview: base.pendingReview,
    approved: base.closedSuccessful,
    inProgress: requests.filter((r) => IN_PROGRESS_STATUSES.has(r.status)).length,
    field: fieldCount,
    total: requests.length,
  };
}
