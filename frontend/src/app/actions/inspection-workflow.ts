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
import { ensureDasmCarOnCore } from "@/lib/core/ensure-dasm-car-on-core";
import {
  defaultReportItemRows,
  executeApproveInspectionReport,
  executeRejectInspectionReport,
  SUBMIT_FOR_REVIEW_SUMMARY,
} from "@/lib/inspection/report-approval-core";
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
  | { ok: true; requestId?: string }
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
    const preferredWorkshopId =
      String(formData.get("preferred_workshop_id") ?? "").trim() || null;
    const preferredServiceModeRaw = String(
      formData.get("preferred_service_mode") ?? "workshop"
    ).trim();
    const preferredServiceMode =
      preferredServiceModeRaw === "field" ? "field" : "workshop";
    const preferredSlotRaw = String(formData.get("preferred_slot_at") ?? "").trim();
    let preferredSlotAt: string | null = null;
    if (preferredSlotRaw) {
      const parsed = new Date(preferredSlotRaw);
      if (Number.isNaN(parsed.getTime())) {
        return { ok: false, message: "موعد التفضيل غير صالح." };
      }
      preferredSlotAt = parsed.toISOString();
    }

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

    if (preferredWorkshopId) {
      const { data: preferredWorkshop, error: preferredWorkshopErr } = await sb
        .from("inspection_workshops")
        .select("id, is_verified, is_suspended")
        .eq("id", preferredWorkshopId)
        .maybeSingle();
      if (
        preferredWorkshopErr ||
        !preferredWorkshop ||
        preferredWorkshop.is_verified !== true ||
        preferredWorkshop.is_suspended === true
      ) {
        return {
          ok: false,
          message: "الورشة المفضّلة غير متاحة أو غير معتمدة.",
        };
      }
    }

    const { data, error } = await sb
      .from("inspection_requests")
      .insert({
        title,
        dasm_car_id: dasm_car_id || "pending",
        vehicle_label,
        dasm_user_id,
        auction_reference,
        status: "submitted",
        service_mode: preferredServiceMode,
        preferred_workshop_id: preferredWorkshopId,
        preferred_slot_at: preferredSlotAt,
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

    const preferenceParts: string[] = [
      `نوع الخدمة المفضّل: ${preferredServiceMode === "field" ? "ميداني" : "في الورشة"}`,
    ];
    if (preferredWorkshopId) {
      preferenceParts.push(`ورشة مفضّلة (تفضيل عميل): ${preferredWorkshopId}`);
    }

    await insertHistory(data.id, "submitted", preferenceParts.join(" — "));
    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/my-inspections");
    revalidatePath(`/track/${data.id}`);
    return { ok: true, requestId: data.id };
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
      .select("status, preferred_slot_at, preferred_workshop_id")
      .eq("id", requestId)
      .single();
    if (fetchErr || !req || req.status !== "submitted") {
      return { ok: false, message: "لا يمكن الإسناد في هذه الحالة." };
    }

    const quotedFee = await resolveQuotedFeeForAssign(workshopId, serviceMode);
    const preferredSlotAt =
      typeof req.preferred_slot_at === "string" && req.preferred_slot_at.trim()
        ? req.preferred_slot_at
        : null;

    const { error } = await sb
      .from("inspection_requests")
      .update({
        workshop_id: workshopId,
        inspector_id: inspectorId,
        status: "assigned",
        service_mode: serviceMode,
        field_service_address: serviceMode === "field" ? fieldAddress : null,
        // Seed field calendar from customer preference when assigning field mode
        ...(serviceMode === "field" && preferredSlotAt
          ? { field_scheduled_at: preferredSlotAt }
          : {}),
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
    const preferenceHint =
      req.preferred_workshop_id && req.preferred_workshop_id === workshopId
        ? " (مطابق لتفضيل العميل)"
        : req.preferred_workshop_id
          ? " (تفضيل العميل كان ورشة أخرى)"
          : "";
    const modeNote =
      serviceMode === "field"
        ? `تم الإسناد — فحص ميداني: ${fieldAddress}${preferenceHint}`
        : `تم الإسناد — فحص في الورشة${preferenceHint}`;
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

    const summary = SUBMIT_FOR_REVIEW_SUMMARY;

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

    const rows = defaultReportItemRows(rep.id);

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
    const result = await executeApproveInspectionReport(requestId, ACTOR);
    if (!result.ok) return result;

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/reports/${result.reportId}`);
    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapAccessError(e) };
  }
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
    const result = await executeRejectInspectionReport(requestId, reason, ACTOR);
    if (!result.ok) return result;

    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/reports/${result.reportId}`);
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
