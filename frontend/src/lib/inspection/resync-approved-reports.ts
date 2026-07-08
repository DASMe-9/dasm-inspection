import "server-only";

import { requireAdminClient } from "@/lib/supabase/admin";
import { retryReportCoreSync } from "@/lib/inspection/report-approval-core";
import type { CoreSyncStatus } from "@/lib/inspection/report-core-sync-status";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";

export type ResyncOutcome = {
  reportId: string;
  status: CoreSyncStatus | "error";
  error?: string;
};
export type ResyncSummary = { scanned: number; results: ResyncOutcome[] };

/**
 * شبكة أمان لمزامنة Core: تعيد دفع كل تقرير معتمد لم يُزامَن بعد
 * (`core_sync_status` ∈ {pending, failed}) عبر `retryReportCoreSync` (idempotent).
 *
 * الغرض: منع بقاء تقرير معتمد عالقاً على `pending` صامتاً — إمّا يُصبح `synced`،
 * أو `skipped`/`failed` مع سبب في `core_sync_error`. تُستدعى يدويّاً أو عبر كرون.
 */
export async function resyncApprovedReportsToCore(limit = 100): Promise<ResyncSummary> {
  const sb = requireAdminClient();
  const { data, error } = await sb
    .from("inspection_reports")
    .select("id")
    .not("approved_at", "is", null)
    .in("core_sync_status", ["pending", "failed"])
    .limit(limit);

  if (error) {
    inspectionOpsLog("error", "core_report_resync_query_failed", {
      message: error.message,
    });
    return { scanned: 0, results: [] };
  }

  const rows = (data ?? []) as { id: string }[];
  const results: ResyncOutcome[] = [];
  for (const r of rows) {
    try {
      const status = await retryReportCoreSync(r.id);
      results.push({ reportId: r.id, status });
    } catch (e) {
      results.push({
        reportId: r.id,
        status: "error",
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  inspectionOpsLog("warn", "core_report_resync_done", {
    scanned: rows.length,
    synced: results.filter((x) => x.status === "synced").length,
    skipped: results.filter((x) => x.status === "skipped").length,
    failed: results.filter((x) => x.status === "failed").length,
    error: results.filter((x) => x.status === "error").length,
  });
  return { scanned: rows.length, results };
}
