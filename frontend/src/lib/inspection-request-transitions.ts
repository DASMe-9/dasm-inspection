import type { InspectionRequestStatus, InspectionServiceMode } from "@/types";

export type RequestTransitionContext = {
  status: InspectionRequestStatus;
  serviceMode: InspectionServiceMode;
};

export function effectiveServiceMode(
  mode: InspectionServiceMode | null | undefined
): InspectionServiceMode {
  return mode === "field" ? "field" : "workshop";
}

/** هل يمكن بدء الفحص (in_progress) من الحالة الحالية؟ */
export function canStartInspection(ctx: RequestTransitionContext): boolean {
  if (ctx.serviceMode === "field") {
    return ctx.status === "on_site";
  }
  return ctx.status === "assigned";
}

export function canDispatchInspector(ctx: RequestTransitionContext): boolean {
  return ctx.serviceMode === "field" && ctx.status === "assigned";
}

export function canConfirmOnSite(ctx: RequestTransitionContext): boolean {
  return ctx.serviceMode === "field" && ctx.status === "dispatched";
}

export const OPEN_REQUEST_STATUSES: InspectionRequestStatus[] = [
  "submitted",
  "assigned",
  "dispatched",
  "on_site",
  "in_progress",
  "pending_review",
];

export const CANCELLABLE_REQUEST_STATUSES: InspectionRequestStatus[] = [
  "submitted",
  "assigned",
  "dispatched",
  "on_site",
  "in_progress",
];
