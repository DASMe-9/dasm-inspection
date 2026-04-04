"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/supabase/admin";
import type { InspectionRequestStatus } from "@/types";

const ACTOR = "inspection_admin" as const;

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
    const title = String(formData.get("title") ?? "").trim();
    const dasm_car_id = String(formData.get("dasm_car_id") ?? "").trim();
    const vehicle_label = String(formData.get("vehicle_label") ?? "").trim();
    const dasm_user_id = String(formData.get("dasm_user_id") ?? "").trim() || null;
    const auction_reference =
      String(formData.get("auction_reference") ?? "").trim() || null;

    if (!title || !dasm_car_id || !vehicle_label) {
      return { ok: false, message: "عنوان المركبة ومعرّف DASM مطلوبة." };
    }

    const sb = requireAdminClient();
    const { data, error } = await sb
      .from("inspection_requests")
      .insert({
        title,
        dasm_car_id,
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

    await insertHistory(data.id, "submitted");
    revalidatePath("/");
    revalidatePath("/requests");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, message: msg };
  }
}

export async function assignInspectionRequestAction(
  requestId: string,
  workshopId: string,
  inspectorId: string
): Promise<ActionResult> {
  try {
    if (!workshopId || !inspectorId) {
      return { ok: false, message: "اختر الورشة والمفتش." };
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

    const { error } = await sb
      .from("inspection_requests")
      .update({
        workshop_id: workshopId,
        inspector_id: inspectorId,
        status: "assigned",
      })
      .eq("id", requestId);

    if (error) return { ok: false, message: error.message };
    await insertHistory(requestId, "assigned", "تم الإسناد");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, message: msg };
  }
}

export async function startInspectionAction(requestId: string): Promise<ActionResult> {
  try {
    const sb = requireAdminClient();
    const { data: req, error: fetchErr } = await sb
      .from("inspection_requests")
      .select("status")
      .eq("id", requestId)
      .single();
    if (fetchErr || !req || req.status !== "assigned") {
      return { ok: false, message: "ابدأ بعد الإسناد." };
    }

    const { error } = await sb
      .from("inspection_requests")
      .update({ status: "in_progress" })
      .eq("id", requestId);
    if (error) return { ok: false, message: error.message };
    await insertHistory(requestId, "in_progress");
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, message: msg };
  }
}

const DEFAULT_REPORT_ITEMS = [
  { section: "المحرك والناقل", label: "مستوى الزيت والتسريبات", status: "pass" as const, sort_order: 0 },
  { section: "المحرك والناقل", label: "حزام التوقيت / السير", status: "warn" as const, notes: "يُنصح بالفحص خلال 5000 كم", sort_order: 1 },
  { section: "الهيكل", label: "الهيكل الخارجي والصدأ", status: "pass" as const, sort_order: 2 },
  { section: "الفرامل والتعليق", label: "أقراص الفرامل الأمامية", status: "fail" as const, notes: "تآكل يتجاوز الحد المسموح", sort_order: 3 },
  { section: "الداخلية", label: "الوسائد والأحزمة", status: "pass" as const, sort_order: 4 },
];

export async function submitReportForReviewAction(requestId: string): Promise<ActionResult> {
  try {
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
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, message: msg };
  }
}

export async function approveReportAction(requestId: string): Promise<ActionResult> {
  try {
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
    revalidatePath("/requests");
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/reports/${req.report_id}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, message: msg };
  }
}

export async function rejectReportAction(
  requestId: string,
  reason: string
): Promise<ActionResult> {
  try {
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
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return { ok: false, message: msg };
  }
}
