import "server-only";

import { listInspectionRequests } from "@/lib/data/inspection";
import type { InspectionRequest } from "@/types";

const FIELD_ACTIVE_STATUSES = new Set([
  "submitted",
  "assigned",
  "dispatched",
  "on_site",
  "in_progress",
  "pending_review",
  "approved",
]);

/** طلبات الفحص الميداني للورشة (للتقويم والخريطة). */
export async function listWorkshopFieldRequests(
  workshopId: string
): Promise<InspectionRequest[]> {
  const all = await listInspectionRequests({
    workshopId,
    sort: "updated_desc",
  });
  return all.filter(
    (r) =>
      r.serviceMode === "field" &&
      FIELD_ACTIVE_STATUSES.has(r.status) &&
      Boolean(r.fieldServiceAddress?.trim())
  );
}
