import "server-only";

import { DEFAULT_REPORT_ITEMS } from "@/lib/checklist/default-report-items";
import {
  getInspectionRequest,
  getReport,
  getReportByRequestId,
} from "@/lib/data/inspection";
import type { NormalizedInspectionClaims } from "@/lib/auth/normalize-claims";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import {
  canConfirmOnSite,
  canStartInspection,
  effectiveServiceMode,
} from "@/lib/inspection-request-transitions";
import { requireAdminClient } from "@/lib/supabase/admin";
import {
  executeApproveInspectionReport,
  executeRejectInspectionReport,
} from "@/lib/inspection/report-approval-core";
import type {
  InspectionReport,
  InspectionRequest,
  ReportItemStatus,
} from "@/types";
import type { AppRole } from "@/types";

export type MobileActionResult =
  | { ok: true }
  | { ok: false; message: string };

function personaOf(normalized: NormalizedInspectionClaims): AppRole | "unknown" {
  return (normalized.inspectionRole ?? "unknown") as AppRole | "unknown";
}

export function canAccessMobileRequest(
  req: InspectionRequest,
  normalized: NormalizedInspectionClaims
): boolean {
  const persona = personaOf(normalized);

  if (persona === "inspection_admin" || persona === "super_admin") {
    return true;
  }

  if (persona === "dasm_user") {
    return req.dasm_user_id === normalized.userId;
  }

  if (isWorkshopOperatorRole(persona) && normalized.workshopId) {
    return req.workshopId === normalized.workshopId;
  }

  if (
    (persona === "inspector" || persona === "mechanic") &&
    normalized.inspectorRecordId
  ) {
    return req.inspectorId === normalized.inspectorRecordId;
  }

  return false;
}

export function canMutateMobileInspectorWorkflow(
  req: InspectionRequest,
  normalized: NormalizedInspectionClaims
): boolean {
  const persona = personaOf(normalized);
  if (persona === "inspection_admin" || persona === "super_admin") {
    return true;
  }
  if (
    (persona === "inspector" || persona === "mechanic") &&
    normalized.inspectorRecordId
  ) {
    return req.inspectorId === normalized.inspectorRecordId;
  }
  return false;
}

export function canMutateMobileWorkshopApproval(
  req: InspectionRequest,
  normalized: NormalizedInspectionClaims
): boolean {
  const persona = personaOf(normalized);
  if (persona === "inspection_admin" || persona === "super_admin") {
    return true;
  }
  if (isWorkshopOperatorRole(persona) && normalized.workshopId) {
    return req.workshopId === normalized.workshopId && req.status === "pending_review";
  }
  return false;
}

function workshopActorRole(normalized: NormalizedInspectionClaims): AppRole {
  const persona = personaOf(normalized);
  if (persona === "workshop_owner" || persona === "workshop_manager") {
    return persona;
  }
  return "inspection_admin";
}

async function insertMobileHistory(
  requestId: string,
  status: InspectionRequest["status"],
  note?: string
) {
  const sb = requireAdminClient();
  await sb.from("inspection_status_history").insert({
    request_id: requestId,
    status,
    actor_role: "inspector",
    note: note ?? null,
  });
}

export async function ensureDraftChecklistReport(
  requestId: string
): Promise<MobileActionResult & { report?: InspectionReport }> {
  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false, message: "الطلب غير موجود." };
  if (req.status !== "in_progress") {
    return { ok: false, message: "قائمة الفحص متاحة أثناء التنفيذ فقط." };
  }
  if (!req.workshopId || !req.inspectorId) {
    return { ok: false, message: "الورشة والمفتش مطلوبان." };
  }

  if (req.reportId) {
    const existing = await getReport(req.reportId);
    if (existing) return { ok: true, report: existing };
  }

  const byRequest = await getReportByRequestId(requestId);
  if (byRequest) {
    if (!req.reportId) {
      const sb = requireAdminClient();
      await sb
        .from("inspection_requests")
        .update({ report_id: byRequest.id })
        .eq("id", requestId);
    }
    return { ok: true, report: byRequest };
  }

  const sb = requireAdminClient();
  const summary =
    "مسودة تقرير فحص — يُحدَّث من تطبيق المفتش قبل الإرسال للمراجعة.";

  const { data: rep, error: repErr } = await sb
    .from("inspection_reports")
    .insert({
      request_id: requestId,
      workshop_id: req.workshopId,
      inspector_id: req.inspectorId,
      overall_summary: summary,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (repErr || !rep) {
    return { ok: false, message: repErr?.message ?? "فشل إنشاء مسودة التقرير" };
  }

  const rows = DEFAULT_REPORT_ITEMS.map((it) => ({
    report_id: rep.id,
    section: it.section,
    label: it.label,
    status: it.status,
    notes: it.notes ?? null,
    sort_order: it.sort_order,
  }));

  const { error: itemsErr } = await sb.from("inspection_report_items").insert(rows);
  if (itemsErr) {
    await sb.from("inspection_reports").delete().eq("id", rep.id);
    return { ok: false, message: itemsErr.message };
  }

  const { error: linkErr } = await sb
    .from("inspection_requests")
    .update({ report_id: rep.id })
    .eq("id", requestId);

  if (linkErr) return { ok: false, message: linkErr.message };

  const report = await getReport(rep.id);
  if (!report) return { ok: false, message: "تعذّر تحميل قائمة الفحص." };
  return { ok: true, report };
}

export async function mobileConfirmOnSite(
  requestId: string,
  normalized: NormalizedInspectionClaims,
  coords?: { lat?: number | null; lng?: number | null }
): Promise<MobileActionResult> {
  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false, message: "الطلب غير موجود." };
  if (!canMutateMobileInspectorWorkflow(req, normalized)) {
    return { ok: false, message: "ليس لديك صلاحية على هذا الطلب." };
  }

  const ctx = {
    status: req.status,
    serviceMode: effectiveServiceMode(req.serviceMode),
  };
  if (!canConfirmOnSite(ctx)) {
    return { ok: false, message: "تأكيد الوصول متاح بعد حالة «مُوجَّه» فقط." };
  }

  const sb = requireAdminClient();
  const { error } = await sb
    .from("inspection_requests")
    .update({
      status: "on_site",
      on_site_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { ok: false, message: error.message };

  const lat = coords?.lat;
  const lng = coords?.lng;
  const gpsNote =
    typeof lat === "number" && typeof lng === "number"
      ? `المفتش في الموقع (GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)})`
      : "المفتش في الموقع";

  await insertMobileHistory(requestId, "on_site", gpsNote);
  return { ok: true };
}

export async function mobileStartInspection(
  requestId: string,
  normalized: NormalizedInspectionClaims
): Promise<MobileActionResult> {
  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false, message: "الطلب غير موجود." };
  if (!canMutateMobileInspectorWorkflow(req, normalized)) {
    return { ok: false, message: "ليس لديك صلاحية على هذا الطلب." };
  }

  const ctx = {
    status: req.status,
    serviceMode: effectiveServiceMode(req.serviceMode),
  };
  if (!canStartInspection(ctx)) {
    return {
      ok: false,
      message:
        ctx.serviceMode === "field"
          ? "ابدأ الفحص بعد تأكيد الوصول للموقع."
          : "ابدأ الفحص بعد الإسناد.",
    };
  }

  const sb = requireAdminClient();
  const { error } = await sb
    .from("inspection_requests")
    .update({ status: "in_progress" })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  await insertMobileHistory(requestId, "in_progress");
  const draft = await ensureDraftChecklistReport(requestId);
  if (!draft.ok) return draft;
  return { ok: true };
}

export async function mobileUpdateChecklistItem(
  itemId: string,
  status: ReportItemStatus,
  notes: string | undefined,
  normalized: NormalizedInspectionClaims
): Promise<MobileActionResult> {
  if (!itemId) return { ok: false, message: "معرّف البند مطلوب." };
  const valid: ReportItemStatus[] = ["pass", "warn", "fail", "na"];
  if (!valid.includes(status)) {
    return { ok: false, message: "حالة غير صالحة." };
  }

  const sb = requireAdminClient();
  const { data: item, error: fetchErr } = await sb
    .from("inspection_report_items")
    .select("id, report_id")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchErr || !item) {
    return { ok: false, message: "البند غير موجود." };
  }

  const { data: rep } = await sb
    .from("inspection_reports")
    .select("request_id")
    .eq("id", item.report_id)
    .maybeSingle();

  if (!rep?.request_id) {
    return { ok: false, message: "التقرير غير مرتبط بطلب." };
  }

  const req = await getInspectionRequest(rep.request_id);
  if (!req) return { ok: false, message: "الطلب غير موجود." };
  if (!canMutateMobileInspectorWorkflow(req, normalized)) {
    return { ok: false, message: "ليس لديك صلاحية تعديل قائمة الفحص." };
  }
  if (req.status !== "in_progress") {
    return { ok: false, message: "التعديل مسموح أثناء التنفيذ فقط." };
  }

  const { error } = await sb
    .from("inspection_report_items")
    .update({ status, notes: notes ?? null })
    .eq("id", itemId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function mobileApproveReport(
  requestId: string,
  normalized: NormalizedInspectionClaims
): Promise<MobileActionResult> {
  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false, message: "الطلب غير موجود." };
  if (!canMutateMobileWorkshopApproval(req, normalized)) {
    return { ok: false, message: "ليس لديك صلاحية اعتماد هذا التقرير." };
  }
  if (!req.reportId) {
    return { ok: false, message: "لا يوجد تقرير مرتبط." };
  }

  const result = await executeApproveInspectionReport(
    requestId,
    workshopActorRole(normalized)
  );
  if (!result.ok) return result;
  return { ok: true };
}

export async function mobileRejectReport(
  requestId: string,
  reason: string,
  normalized: NormalizedInspectionClaims
): Promise<MobileActionResult> {
  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false, message: "الطلب غير موجود." };
  if (!canMutateMobileWorkshopApproval(req, normalized)) {
    return { ok: false, message: "ليس لديك صلاحية رفض هذا التقرير." };
  }

  const result = await executeRejectInspectionReport(
    requestId,
    reason,
    workshopActorRole(normalized)
  );
  if (!result.ok) return result;
  return { ok: true };
}
