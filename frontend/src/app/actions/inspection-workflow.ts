"use server";

import { revalidatePath } from "next/cache";
import { assertInspectionMutationAllowed } from "@/lib/auth/access-layer.server";
import { requireAdminClient } from "@/lib/supabase/admin";
import type {
  InspectionRequestStatus,
  InspectionServiceMode,
  ReportItemStatus,
} from "@/types";
import { buildWorkshopPricingMap, resolveWorkshopServicePrice } from "@/lib/inspection-pricing";
import {
  canConfirmOnSite,
  canDispatchInspector,
  canStartInspection,
  CANCELLABLE_REQUEST_STATUSES,
  effectiveServiceMode,
} from "@/lib/inspection-request-transitions";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { DEFAULT_REPORT_ITEMS } from "@/lib/checklist/default-report-items";
import {
  buildReportSyncPayload,
  parseDasmCarId,
} from "@/lib/core/build-report-sync-payload";
import { ensureDasmCarOnCore } from "@/lib/core/ensure-dasm-car-on-core";
import { pushApprovedReportToCore } from "@/lib/core/push-approved-report-to-core";
import {
  canEditRepairQuote,
  normalizeRepairQuoteNotes,
  parseRepairQuoteSar,
} from "@/lib/repair-quote";
import { formatInspectionPriceSar } from "@/lib/inspection-pricing";

const ACTOR = "inspection_admin" as const;

const CANCELLABLE = CANCELLABLE_REQUEST_STATUSES;

type RequestRowForTransition = {
  status: InspectionRequestStatus;
  service_mode: InspectionServiceMode | null;
  field_service_address: string | null;
};

async function loadRequestForTransition(
  requestId: string
): Promise<RequestRowForTransition | null> {
  const sb = requireAdminClient();
  const { data, error } = await sb
    .from("inspection_requests")
    .select("status, service_mode, field_service_address")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    status: data.status as InspectionRequestStatus,
    service_mode: data.service_mode as InspectionServiceMode | null,
    field_service_address: data.field_service_address,
  };
}

function transitionContext(row: RequestRowForTransition) {
  return {
    status: row.status,
    serviceMode: effectiveServiceMode(row.service_mode),
  };
}

async function resolveQuotedFeeForAssign(
  workshopId: string,
  serviceMode: InspectionServiceMode
): Promise<number | null> {
  const sb = requireAdminClient();
  const { data } = await sb
    .from("inspection_service_pricing")
    .select("workshop_id, service_mode, price_sar, currency")
    .eq("is_active", true);
  const map = buildWorkshopPricingMap(
    (data ?? []).map((r) => ({
      workshop_id: r.workshop_id as string | null,
      service_mode: r.service_mode as InspectionServiceMode,
      price_sar: Number(r.price_sar),
      currency: (r.currency as string) || "SAR",
    }))
  );
  const resolved = resolveWorkshopServicePrice(workshopId, serviceMode, map);
  return resolved.amountSar;
}

function mapAccessError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "INSPECTION_AUTH_REQUIRED") {
      return "انتهت الجلسة أو غير مصرّح — سجّل الدخول من جديد.";
    }
    if (e.message === "INSPECTION_FORBIDDEN") {
      return "ليس لديك صلاحية لتنفيذ هذا الإجراء.";
    }
  }
  return e instanceof Error ? e.message : "خطأ غير متوقع";
}

async function insertHistory(
  requestId: string,
  status: InspectionRequestStatus,
  note?: string
) {
  const sb = requireAdminClient();
  await sb.from("inspection_status_history").insert({
    request_id: requestId,
    status,
    actor_role: ACTOR,
    note: note ?? null,
  });
}

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function createInspectionRequestAction(formData: FormData): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const title = String(formData.get("title") ?? "").trim();
    const dasm_car_id = String(formData.get("dasm_car_id") ?? "").trim();
    const vehicle_label = String(formData.get("vehicle_label") ?? "").trim();
    const dasm_user_id = String(formData.get("dasm_user_id") ?? "").trim() || null;
    const auction_reference =
      String(formData.get("auction_reference") ?? "").trim() || null;

    if (!title || !vehicle_label) {
      return { ok: false, message: "عنوان الطلب ووصف المركبة مطلوبان." };
    }

    if (!dasm_car_id && !dasm_user_id) {
      return {
        ok: false,
        message: "أدخل dasm_car_id أو اربط الطلب بحساب داسم (dasm_user_id).",
      };
    }

    const sb = requireAdminClient();
    const { data, error } = await sb
      .from("inspection_requests")
      .insert({
        title,
        dasm_car_id: dasm_car_id || "pending",
        vehicle_label,
        dasm_user_id,
        auction_reference,
        status: "submitted",
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? "فشل الإنشاء" };
    }

    if (!dasm_car_id && dasm_user_id) {
      const userId = Number.parseInt(dasm_user_id, 10);
      if (Number.isFinite(userId) && userId > 0) {
        const carId = await ensureDasmCarOnCore({
          userId,
          vehicleLabel: vehicle_label,
          inspectionRequestId: data.id,
          title,
        });
        if (carId) {
          await sb
            .from("inspection_requests")
            .update({ dasm_car_id: String(carId) })
            .eq("id", data.id);
        }
      }
    }

    await insertHistory(data.id, "submitted");
    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function assignInspectionRequestAction(
  requestId: string,
  workshopId: string,
  inspectorId: string,
  options?: {
    serviceMode?: InspectionServiceMode;
    fieldServiceAddress?: string;
  }
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    if (!workshopId || !inspectorId) {
      return { ok: false, message: "اختر الورشة والمفتش." };
    }
    const serviceMode = effectiveServiceMode(options?.serviceMode);
    const fieldAddress = options?.fieldServiceAddress?.trim() ?? "";
    if (serviceMode === "field" && !fieldAddress) {
      return { ok: false, message: "عنوان الفحص الميداني مطلوب." };
    }

    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status")
      .eq("id", requestId)
      .single();
    if (fetchErr || !req || req.status !== "submitted") {
      return { ok: false, message: "لا يمكن الإسناد في هذه الحالة." };
    }

    const quotedFee = await resolveQuotedFeeForAssign(workshopId, serviceMode);

    const { error } = await sb
      .from("inspection_requests")
      .update({
        workshop_id: workshopId,
        inspector_id: inspectorId,
        status: "assigned",
        service_mode: serviceMode,
        field_service_address: serviceMode === "field" ? fieldAddress : null,
        quoted_fee_sar: quotedFee,
        inspection_fee_payment_status:
          quotedFee != null && quotedFee > 0 ? "unpaid" : "waived",
        inspection_fee_payment_ref: null,
        inspection_fee_paid_at: null,
        dispatched_at: null,
        on_site_at: null,
      })
      .eq("id", requestId);

    if (error) return { ok: false, message: error.message };
    const modeNote =
      serviceMode === "field"
        ? `تم الإسناد — فحص ميداني: ${fieldAddress}`
        : "تم الإسناد — فحص في الورشة";
    await insertHistory(requestId, "assigned", modeNote);
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/my-inspections");
    revalidatePath(`/track/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function dispatchInspectionAction(
  requestId: string
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const req = await loadRequestForTransition(requestId);
    if (!req) return { ok: false, message: "الطلب غير موجود." };
    const ctx = transitionContext(req);
    if (!canDispatchInspector(ctx)) {
      return {
        ok: false,
        message: "التوجيه الميداني متاح فقط لطلبات الفحص الميداني المُسنَّدة.",
      };
    }

    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_requests")
      .update({
        status: "dispatched",
        dispatched_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) return { ok: false, message: error.message };
    await insertHistory(
      requestId,
      "dispatched",
      "تم توجيه المفتش إلى موقع العميل"
    );
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/my-inspections");
    revalidatePath(`/track/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function confirmOnSiteAction(
  requestId: string
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const req = await loadRequestForTransition(requestId);
    if (!req) return { ok: false, message: "الطلب غير موجود." };
    const ctx = transitionContext(req);
    if (!canConfirmOnSite(ctx)) {
      return {
        ok: false,
        message: "تأكيد الوصول متاح بعد حالة «مُوجَّه» فقط.",
      };
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
    await insertHistory(requestId, "on_site", "المفتش في الموقع");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/my-inspections");
    revalidatePath(`/track/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function startInspectionAction(requestId: string): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const row = await loadRequestForTransition(requestId);
    if (!row) return { ok: false, message: "الطلب غير موجود." };
    const ctx = transitionContext(row);
    if (!canStartInspection(ctx)) {
      return {
        ok: false,
        message:
          ctx.serviceMode === "field"
            ? "ابدأ الفحص بعد تأكيد الوصول للموقع (في الموقع)."
            : "ابدأ الفحص بعد الإسناد.",
      };
    }

    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_requests")
      .update({ status: "in_progress" })
      .eq("id", requestId);
    if (error) return { ok: false, message: error.message };
    await insertHistory(requestId, "in_progress");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function submitReportForReviewAction(requestId: string): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status, workshop_id, inspector_id, report_id")
      .eq("id", requestId)
      .single();

    if (fetchErr || !req) return { ok: false, message: "الطلب غير موجود." };
    if (req.status !== "in_progress") {
      return { ok: false, message: "يُرسل التقرير أثناء التنفيذ فقط." };
    }
    if (!req.workshop_id || !req.inspector_id) {
      return { ok: false, message: "الورشة والمفتش مطلوبان." };
    }
    if (req.report_id) {
      return { ok: false, message: "يوجد تقرير مسبقاً." };
    }

    const summary =
      "تقرير فحص فني مبدئي: مراجعة البنود أدناه قبل الاعتماد النهائي.";

    const { data: rep, error: repErr } = await sb
      .from("inspection_reports")
      .insert({
        request_id: requestId,
        workshop_id: req.workshop_id,
        inspector_id: req.inspector_id,
        overall_summary: summary,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (repErr || !rep) {
      return { ok: false, message: repErr?.message ?? "فشل إنشاء التقرير" };
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

    const { error: upErr } = await sb
      .from("inspection_requests")
      .update({
        report_id: rep.id,
        status: "pending_review",
      })
      .eq("id", requestId);

    if (upErr) return { ok: false, message: upErr.message };
    await insertHistory(requestId, "pending_review", "أُرسل التقرير للمراجعة");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/reports/${rep.id}`);
    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function approveReportAction(requestId: string): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status, report_id")
      .eq("id", requestId)
      .single();

    if (fetchErr || !req || req.status !== "pending_review" || !req.report_id) {
      return { ok: false, message: "لا يوجد تقرير بانتظار المراجعة." };
    }

    const now = new Date().toISOString();
    const { error: repErr } = await sb
      .from("inspection_reports")
      .update({
        approved_at: now,
        approved_by_role: ACTOR,
        rejection_reason: null,
      })
      .eq("id", req.report_id);

    if (repErr) return { ok: false, message: repErr.message };

    const { error: reqErr } = await sb
      .from("inspection_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    if (reqErr) return { ok: false, message: reqErr.message };
    await insertHistory(requestId, "approved", "تم اعتماد التقرير");

    await syncApprovedReportToCoreAfterApprove(sb, requestId, req.report_id, now);

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/reports/${req.report_id}`);
    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

async function syncApprovedReportToCoreAfterApprove(
  sb: ReturnType<typeof requireAdminClient>,
  requestId: string,
  reportId: string,
  approvedAtIso: string
): Promise<void> {
  const { data: reqRow } = await sb
    .from("inspection_requests")
    .select(
      "dasm_car_id, dasm_user_id, vehicle_label, title, workshop_id, inspection_workshops(name)"
    )
    .eq("id", requestId)
    .single();

  const row = reqRow as {
    dasm_car_id?: string | null;
    dasm_user_id?: string | null;
    vehicle_label?: string | null;
    title?: string | null;
  } | null;

  let carId = parseDasmCarId(row?.dasm_car_id);
  if (!carId && row?.dasm_user_id && row.vehicle_label) {
    const userId = Number.parseInt(String(row.dasm_user_id), 10);
    if (Number.isFinite(userId) && userId > 0) {
      const ensured = await ensureDasmCarOnCore({
        userId,
        vehicleLabel: row.vehicle_label,
        inspectionRequestId: requestId,
        title: row.title ?? undefined,
      });
      if (ensured) {
        carId = ensured;
        await sb
          .from("inspection_requests")
          .update({ dasm_car_id: String(ensured) })
          .eq("id", requestId);
      }
    }
  }

  if (!carId) {
    inspectionOpsLog("warn", "core_report_sync_skipped", {
      reason: "missing_dasm_car_id",
      inspection_request_id: requestId,
      inspection_report_id: reportId,
    });
    return;
  }

  const { data: reportRow } = await sb
    .from("inspection_reports")
    .select("overall_summary")
    .eq("id", reportId)
    .single();

  const { data: items } = await sb
    .from("inspection_report_items")
    .select("status")
    .eq("report_id", reportId);

  const workshop = (reqRow as { inspection_workshops?: { name?: string } | { name?: string }[] | null })
    ?.inspection_workshops;
  const workshopName = Array.isArray(workshop)
    ? workshop[0]?.name
    : workshop?.name;

  const payload = buildReportSyncPayload({
    carId,
    requestId,
    reportId,
    workshopId: (reqRow as { workshop_id?: string | null })?.workshop_id ?? null,
    workshopName: workshopName ?? null,
    overallSummary:
      (reportRow as { overall_summary?: string | null } | null)?.overall_summary ?? null,
    approvedAtIso,
    items: (items ?? []) as { status: ReportItemStatus }[],
  });

  await pushApprovedReportToCore(payload);
}

export async function updateReportItemAction(
  itemId: string,
  status: ReportItemStatus,
  notes?: string
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    if (!itemId) {
      return { ok: false, message: "معرّف البند مطلوب." };
    }
    const validStatuses: ReportItemStatus[] = ["pass", "warn", "fail", "na"];
    if (!validStatuses.includes(status)) {
      return { ok: false, message: "حالة غير صالحة." };
    }

    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_report_items")
      .update({
        status,
        notes: notes ?? null,
      })
      .eq("id", itemId);

    if (error) return { ok: false, message: error.message };
    revalidatePath("/reports");
    revalidatePath("/requests");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function rejectReportAction(
  requestId: string,
  reason: string
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    const r = reason.trim();
    if (!r) return { ok: false, message: "اذكر سبب الرفض." };
    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status, report_id")
      .eq("id", requestId)
      .single();

    if (fetchErr || !req || req.status !== "pending_review" || !req.report_id) {
      return { ok: false, message: "لا يوجد تقرير بانتظار المراجعة." };
    }

    const { error: repErr } = await sb
      .from("inspection_reports")
      .update({
        approved_at: null,
        approved_by_role: null,
        rejection_reason: r,
      })
      .eq("id", req.report_id);

    if (repErr) return { ok: false, message: repErr.message };

    const { error: reqErr } = await sb
      .from("inspection_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (reqErr) return { ok: false, message: reqErr.message };
    await insertHistory(requestId, "rejected", r);
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/reports/${req.report_id}`);
    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

const ATTACH_MAX_BYTES = 8 * 1024 * 1024;
const ATTACH_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function safeFileSegment(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, "_");
  return (base || "file").slice(0, 160);
}

export async function cancelInspectionRequestAction(
  requestId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    if (!requestId?.trim()) {
      return { ok: false, message: "معرّف الطلب غير صالح." };
    }
    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status, report_id")
      .eq("id", requestId)
      .single();

    if (fetchErr || !req) {
      return { ok: false, message: "الطلب غير موجود." };
    }
    if (!CANCELLABLE.includes(req.status as InspectionRequestStatus)) {
      return {
        ok: false,
        message: "لا يمكن الإلغاء في هذه الحالة (بعد المراجعة أو الإغلاق).",
      };
    }
    if (req.report_id) {
      return {
        ok: false,
        message: "لا يمكن إلغاء طلب مرتبط بتقرير — استخدم مسار الرفض إن وُجد.",
      };
    }

    const { error } = await sb
      .from("inspection_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId);

    if (error) return { ok: false, message: error.message };

    const note = reason?.trim() || "أُلغي الطلب";
    await insertHistory(requestId, "cancelled", note);
    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/my-inspections");
    revalidatePath(`/track/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

/** عرض إصلاح اختياري — منفصل عن `quoted_fee_sar` (رسوم خدمة الفحص). */
export async function setRepairQuoteAction(
  requestId: string,
  repairQuoteSar: number | null,
  repairQuoteNotes?: string | null
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    if (!requestId?.trim()) {
      return { ok: false, message: "معرّف الطلب غير صالح." };
    }

    const amount =
      repairQuoteSar === null ? null : parseRepairQuoteSar(repairQuoteSar);
    if (repairQuoteSar !== null && amount === null) {
      return { ok: false, message: "مبلغ عرض الإصلاح غير صالح." };
    }

    const notes = normalizeRepairQuoteNotes(repairQuoteNotes);
    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status")
      .eq("id", requestId)
      .single();

    if (fetchErr || !req) {
      return { ok: false, message: "الطلب غير موجود." };
    }

    const status = req.status as InspectionRequestStatus;
    if (!canEditRepairQuote(status)) {
      return {
        ok: false,
        message:
          "عرض الإصلاح يُسجَّل بعد بدء الفحص (قيد التنفيذ أو المراجعة أو بعد الاعتماد).",
      };
    }

    const offeredAt = amount != null ? new Date().toISOString() : null;
    const { error } = await sb
      .from("inspection_requests")
      .update({
        repair_quote_sar: amount,
        repair_quote_notes: notes,
        repair_quote_offered_at: offeredAt,
      })
      .eq("id", requestId);

    if (error) return { ok: false, message: error.message };

    const historyNote =
      amount != null
        ? `عرض إصلاح: ${formatInspectionPriceSar(amount)}${notes ? ` — ${notes}` : ""}`
        : "إزالة عرض الإصلاح";
    await insertHistory(requestId, status, historyNote);

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/track/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
}

export async function uploadInspectionAttachmentAction(
  requestId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await assertInspectionMutationAllowed();
    if (!requestId?.trim()) {
      return { ok: false, message: "معرّف الطلب مطلوب." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "اختر ملفاً صالحاً." };
    }
    if (file.size > ATTACH_MAX_BYTES) {
      return { ok: false, message: "الحد الأقصى 8 ميغابايت." };
    }
    const mime = file.type || "application/octet-stream";
    if (!ATTACH_ALLOWED_MIME.has(mime)) {
      return {
        ok: false,
        message: "يُسمح بصور JPEG/PNG/WebP أو PDF فقط.",
      };
    }

    const sb = requireAdminClient();
    const { data: req, error: reqErr } = await sb
      .from("inspection_requests")
      .select("id")
      .eq("id", requestId)
      .maybeSingle();
    if (reqErr || !req) {
      return { ok: false, message: "الطلب غير موجود." };
    }

    const bucket =
      process.env.INSPECTION_ATTACHMENTS_BUCKET?.trim() ||
      "inspection-attachments";
    const safeName = safeFileSegment(file.name);
    const storagePath = `${requestId}/${Date.now()}-${safeName}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await sb.storage
      .from(bucket)
      .upload(storagePath, buf, {
        contentType: mime,
        upsert: false,
      });

    if (upErr) {
      inspectionOpsLog("error", "attachment_upload_failed", {
        request_id: requestId,
        bucket,
        storage_path: storagePath,
        message: upErr.message,
      });
      return {
        ok: false,
        message:
          upErr.message ||
          "فشل الرفع — تأكد من إنشاء الحاوية في Supabase (انظر الهجرة).",
      };
    }

    const { error: insErr } = await sb.from("inspection_attachments").insert({
      request_id: requestId,
      report_id: null,
      file_name: file.name.slice(0, 255),
      mime_type: mime,
      storage_path: storagePath,
    });

    if (insErr) {
      inspectionOpsLog("error", "attachment_db_insert_failed", {
        request_id: requestId,
        bucket,
        storage_path: storagePath,
        message: insErr.message,
      });
      await sb.storage.from(bucket).remove([storagePath]);
      return { ok: false, message: insErr.message };
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    return { ok: true };
  } catch (e) {
    inspectionOpsLog("error", "attachment_upload_exception", {
      request_id: requestId,
      message: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, message: mapAccessError(e) };
  }
}
