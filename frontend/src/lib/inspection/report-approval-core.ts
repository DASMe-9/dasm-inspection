import "server-only";

import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { DEFAULT_REPORT_ITEMS } from "@/lib/checklist/default-report-items";
import {
  buildReportSyncPayload,
  parseDasmCarId,
} from "@/lib/core/build-report-sync-payload";
import { ensureDasmCarOnCore } from "@/lib/core/ensure-dasm-car-on-core";
import { pushApprovedReportToCore } from "@/lib/core/push-approved-report-to-core";
import { requireAdminClient } from "@/lib/supabase/admin";
import type { AppRole, InspectionRequestStatus, ReportItemStatus } from "@/types";

export type ReportApprovalResult =
  | { ok: true; reportId: string }
  | { ok: false; message: string };

async function insertApprovalHistory(
  requestId: string,
  status: InspectionRequestStatus,
  actorRole: AppRole,
  note?: string
) {
  const sb = requireAdminClient();
  await sb.from("inspection_status_history").insert({
    request_id: requestId,
    status,
    actor_role: actorRole,
    note: note ?? null,
  });
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

export async function executeApproveInspectionReport(
  requestId: string,
  approvedByRole: AppRole
): Promise<ReportApprovalResult> {
  const sb = requireAdminClient();
  const { data: req, error: fetchErr } = await sb
    .from("inspection_requests")
    .select("status, report_id")
    .eq("id", requestId)
    .single();

  if (fetchErr || !req || req.status !== "pending_review" || !req.report_id) {
    return { ok: false, message: "لا يوجد تقرير بانتظار المراجعة." };
  }

  const reportId = req.report_id as string;
  const now = new Date().toISOString();
  const { error: repErr } = await sb
    .from("inspection_reports")
    .update({
      approved_at: now,
      approved_by_role: approvedByRole,
      rejection_reason: null,
    })
    .eq("id", reportId);

  if (repErr) return { ok: false, message: repErr.message };

  const { error: reqErr } = await sb
    .from("inspection_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (reqErr) return { ok: false, message: reqErr.message };

  await insertApprovalHistory(requestId, "approved", approvedByRole, "تم اعتماد التقرير");
  await syncApprovedReportToCoreAfterApprove(sb, requestId, reportId, now);

  return { ok: true, reportId };
}

export async function executeRejectInspectionReport(
  requestId: string,
  reason: string,
  actorRole: AppRole
): Promise<ReportApprovalResult> {
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

  const reportId = req.report_id as string;
  const { error: repErr } = await sb
    .from("inspection_reports")
    .update({
      approved_at: null,
      approved_by_role: null,
      rejection_reason: r,
    })
    .eq("id", reportId);

  if (repErr) return { ok: false, message: repErr.message };

  const { error: reqErr } = await sb
    .from("inspection_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (reqErr) return { ok: false, message: reqErr.message };

  await insertApprovalHistory(requestId, "rejected", actorRole, r);
  return { ok: true, reportId };
}

/** Shared checklist seed used when web submits for review (mobile uses draft earlier). */
export const SUBMIT_FOR_REVIEW_SUMMARY =
  "تقرير فحص فني مبدئي: مراجعة البنود أدناه قبل الاعتماد النهائي.";

export function defaultReportItemRows(reportId: string) {
  return DEFAULT_REPORT_ITEMS.map((it) => ({
    report_id: reportId,
    section: it.section,
    label: it.label,
    status: it.status,
    notes: it.notes ?? null,
    sort_order: it.sort_order,
  }));
}
