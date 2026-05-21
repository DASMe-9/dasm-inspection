import { inspectionOpsLog } from "@/lib/inspection-ops-log";

export type CoreReportSyncPayload = {
  car_id: number;
  inspection_request_id: string;
  inspection_report_id: string;
  workshop_id?: string | null;
  workshop_name?: string | null;
  overall_grade?: "pass" | "conditional" | "fail" | null;
  summary?: { pass: number; warn: number; fail: number; na: number };
  overall_summary?: string | null;
  report_url?: string | null;
  approved_at?: string;
  is_primary?: boolean;
};

const CORE_API_URL =
  process.env.DASM_CORE_API_URL ||
  process.env.DASM_API_URL ||
  "https://api.dasm.com.sa";

const SYNC_ENABLED = process.env.DASM_INSPECTION_SYNC_ENABLED !== "false";

/**
 * يدفع تقريرًا معتمدًا إلى Core بعد الاعتماد (idempotent على inspection_report_id).
 */
export async function pushApprovedReportToCore(
  payload: CoreReportSyncPayload
): Promise<{ ok: boolean; skipped?: boolean; message?: string }> {
  if (!SYNC_ENABLED) {
    return { ok: true, skipped: true, message: "sync_disabled" };
  }

  const token = process.env.DASM_INSPECTION_INTERNAL_PULL_TOKEN?.trim();
  if (!token) {
    inspectionOpsLog("core_report_sync_skipped", {
      reason: "missing_DASM_INSPECTION_INTERNAL_PULL_TOKEN",
      inspection_report_id: payload.inspection_report_id,
    });
    return { ok: false, skipped: true, message: "missing_token" };
  }

  try {
    const res = await fetch(`${CORE_API_URL}/api/internal/dasm-inspection/reports/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-DASM-Internal-Token": token,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      data?: { already_synced?: boolean };
    };

    if (!res.ok) {
      inspectionOpsLog("core_report_sync_failed", {
        status: res.status,
        inspection_report_id: payload.inspection_report_id,
        car_id: payload.car_id,
        message: body.message,
      });
      return { ok: false, message: body.message || `http_${res.status}` };
    }

    inspectionOpsLog("core_report_sync_ok", {
      inspection_report_id: payload.inspection_report_id,
      car_id: payload.car_id,
      already_synced: body.data?.already_synced ?? false,
    });

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    inspectionOpsLog("core_report_sync_error", {
      inspection_report_id: payload.inspection_report_id,
      message,
    });
    return { ok: false, message };
  }
}
