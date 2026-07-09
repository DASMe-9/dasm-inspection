import "server-only";

import {
  findInspectorByDasmUserId,
  getInspectionRequest,
  getReport,
  getReportByRequestId,
  getWorkshop,
  listInspectionRequests,
  listInspectionRequestsForDasmUser,
  listWorkshopsForDirectory,
} from "@/lib/data/inspection";
import {
  canAccessMobileRequest,
  canMutateMobileWorkshopApproval,
  ensureDraftChecklistReport,
} from "@/lib/api/mobile-inspection-mutations";
import { listNotificationsForUser } from "@/lib/data/workshop-follows-data";
import { listRepairRecommendationsForRequest } from "@/lib/data/repair-recommendations-data";
import { listMessagesForRequest } from "@/lib/data/request-messages-data";
import { listWorkshopReviewsForOwner } from "@/lib/data/workshop-insights-data";
import {
  canConfirmOnSite,
  canStartInspection,
  effectiveServiceMode,
} from "@/lib/inspection-request-transitions";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import { authenticateDasmToken } from "@/lib/auth/authenticate-dasm-token";
import { requireAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types";
import type { InspectionReportItem, InspectionRequest, Workshop } from "@/types";
import { getBearerToken } from "@/lib/api/inspection-http-auth";
import type { NextRequest } from "next/server";

export function mobileBearerFromRequest(request: NextRequest): string | null {
  return getBearerToken(request);
}

export async function authenticateMobileRequest(request: NextRequest) {
  const token = mobileBearerFromRequest(request);
  if (!token) {
    return { ok: false as const, status: 401, message: "Authorization Bearer مطلوب" };
  }

  const auth = await authenticateDasmToken(token);
  if (!auth.ok) {
    return { ok: false as const, status: 401, message: auth.message };
  }

  let { normalized } = auth;
  if (!normalized.inspectorRecordId) {
    const inspector = await findInspectorByDasmUserId(normalized.userId);
    if (inspector) {
      normalized = {
        ...normalized,
        inspectorRecordId: inspector.id,
        workshopId: normalized.workshopId ?? inspector.workshopId ?? null,
      };
    }
  }

  return { ok: true as const, normalized, source: auth.source };
}

export function toMobileWorkshopRow(workshop: Workshop) {
  return {
    id: workshop.id,
    slug: workshop.slug,
    name: workshop.name,
    city: workshop.city,
    is_verified: workshop.isVerified,
    pricing: workshop.pricing ?? null,
  };
}

export function toMobileRequestRow(request: InspectionRequest) {
  return {
    id: request.id,
    title: request.title,
    vehicle_label: request.vehicleLabel,
    status: request.status,
    service_mode: request.serviceMode,
    workshop_id: request.workshopId ?? null,
    inspector_id: request.inspectorId ?? null,
    report_id: request.reportId ?? null,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
  };
}

export async function listMobileWorkshops() {
  const workshops = await listWorkshopsForDirectory();
  return workshops.map(toMobileWorkshopRow);
}

export async function listMobileRequestsForAuth(normalized: {
  userId: string;
  inspectionRole: string | null;
  workshopId: string | null;
  inspectorRecordId: string | null;
}) {
  const role = normalized.inspectionRole;
  const persona = (role ?? "unknown") as AppRole | "unknown";

  if (persona === "dasm_user") {
    const rows = await listInspectionRequestsForDasmUser(normalized.userId, {
      sort: "updated_desc",
    });
    return { requests: rows.map(toMobileRequestRow), scope: "dasm_user" as const };
  }

  if (isWorkshopOperatorRole(persona) && normalized.workshopId) {
    const rows = await listInspectionRequests({
      workshopId: normalized.workshopId,
      sort: "updated_desc",
    });
    return { requests: rows.map(toMobileRequestRow), scope: "workshop" as const };
  }

  if (
    (persona === "inspector" || persona === "mechanic") &&
    normalized.inspectorRecordId
  ) {
    const rows = await listInspectionRequests({
      workshopId: normalized.workshopId ?? undefined,
      inspectorId: normalized.inspectorRecordId,
      sort: "updated_desc",
    });
    return { requests: rows.map(toMobileRequestRow), scope: "inspector" as const };
  }

  if (persona === "inspection_admin" || persona === "super_admin") {
    const rows = await listInspectionRequests({ sort: "updated_desc" });
    return { requests: rows.map(toMobileRequestRow), scope: "admin" as const };
  }

  return { requests: [], scope: "none" as const };
}

export function toMobileChecklistItem(item: InspectionReportItem) {
  return {
    id: item.id,
    section: item.section,
    label: item.label,
    status: item.status,
    notes: item.notes ?? null,
  };
}

export async function getMobileRequestDetail(
  requestId: string,
  normalized: {
    userId: string;
    inspectionRole: string | null;
    workshopId: string | null;
    inspectorRecordId: string | null;
  }
) {
  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false as const, status: 404, message: "الطلب غير موجود" };

  const claims = {
    userId: normalized.userId,
    dasmRoles: [] as string[],
    inspectionRole: normalized.inspectionRole,
    workshopId: normalized.workshopId,
    inspectorRecordId: normalized.inspectorRecordId,
  };

  if (!canAccessMobileRequest(req, claims)) {
    return { ok: false as const, status: 403, message: "غير مصرّح بعرض هذا الطلب" };
  }

  const serviceMode = effectiveServiceMode(req.serviceMode);
  const ctx = { status: req.status, serviceMode };
  const canApprove = canMutateMobileWorkshopApproval(req, claims);

  let report =
    (req.reportId ? await getReport(req.reportId) : null) ??
    (await getReportByRequestId(req.id));

  if (req.status === "in_progress" && !report) {
    const draft = await ensureDraftChecklistReport(req.id);
    if (draft.ok && draft.report) report = draft.report;
  }

  // Contact enrichment for the mobile details screen (NO DEAD CONTROLS):
  // workshop phone lives on inspection_workshops. Customer phone is NOT in the
  // inspection schema — only dasm_user_id — and Core has no internal lookup
  // endpoint for it yet, so customer_phone stays null until that lands.
  const workshop = req.workshopId ? await getWorkshop(req.workshopId) : null;

  return {
    ok: true as const,
    request: {
      ...toMobileRequestRow(req),
      field_service_address: req.fieldServiceAddress ?? null,
      field_service_lat: req.fieldServiceLat ?? null,
      field_service_lng: req.fieldServiceLng ?? null,
      workshop_phone: workshop?.phone?.trim() || null,
      customer_phone: null,
      can_confirm_on_site: canConfirmOnSite(ctx),
      can_start: canStartInspection(ctx),
      checklist_editable: req.status === "in_progress",
      can_approve: canApprove,
      can_reject: canApprove,
    },
    checklist: report?.items.map(toMobileChecklistItem) ?? [],
    report_id: report?.id ?? null,
    repair_recommendations: (
      await listRepairRecommendationsForRequest(req.id)
    ).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      estimated_cost_sar: r.estimatedCostSar,
      status: r.status,
    })),
    messages: (await listMessagesForRequest(req.id)).map((m) => ({
      id: m.id,
      sender_dasm_user_id: m.senderDasmUserId,
      sender_role: m.senderRole,
      body: m.body,
      created_at: m.createdAt,
    })),
  };
}

export function toMobileReviewRow(review: {
  id: string;
  rating: number;
  comment?: string;
  status: string;
  inspectionRequestId: string;
  createdAt: string;
}) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment ?? null,
    status: review.status,
    inspection_request_id: review.inspectionRequestId,
    created_at: review.createdAt,
  };
}

export function toMobileNotificationRow(n: {
  id: string;
  kind: string;
  title: string;
  body?: string;
  workshopId?: string;
  readAt?: string;
  createdAt: string;
}) {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body ?? null,
    workshop_id: n.workshopId ?? null,
    read_at: n.readAt ?? null,
    created_at: n.createdAt,
  };
}

export async function listMobileReviewsForAuth(normalized: {
  inspectionRole: string | null;
  workshopId: string | null;
}) {
  const persona = (normalized.inspectionRole ?? "unknown") as AppRole | "unknown";
  if (!isWorkshopOperatorRole(persona) || !normalized.workshopId) {
    return { ok: false as const, status: 403, message: "للمالك/مدير الورشة فقط" };
  }

  const reviews = await listWorkshopReviewsForOwner(normalized.workshopId);
  return {
    ok: true as const,
    reviews: reviews.map(toMobileReviewRow),
  };
}

export async function listMobileNotificationsForAuth(normalized: {
  userId: string;
}) {
  const rows = await listNotificationsForUser(normalized.userId, 50);
  return {
    notifications: rows.map(toMobileNotificationRow),
    unread_count: rows.filter((n) => !n.readAt).length,
  };
}

export async function markMobileNotificationRead(
  notificationId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const sb = requireAdminClient();
  const { data, error } = await sb
    .from("inspection_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("dasm_user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, status: 500, message: error.message };
  if (!data) return { ok: false, status: 404, message: "الإشعار غير موجود" };
  return { ok: true };
}
