import type { ReportItemStatus } from "@/types";
import type { CoreReportSyncPayload } from "@/lib/core/push-approved-report-to-core";
import type { ComputedGrade } from "@/lib/inspection/scoring";

type ReportItemRow = {
  status: ReportItemStatus;
};

function gradeFromItems(items: ReportItemRow[]): "pass" | "conditional" | "fail" {
  if (items.some((i) => i.status === "fail")) return "fail";
  if (items.some((i) => i.status === "warn")) return "conditional";
  return "pass";
}

function countSummary(items: ReportItemRow[]) {
  return items.reduce(
    (acc, i) => {
      if (i.status === "pass") acc.pass += 1;
      else if (i.status === "warn") acc.warn += 1;
      else if (i.status === "fail") acc.fail += 1;
      else acc.na += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0, na: 0 }
  );
}

export function buildReportSyncPayload(input: {
  carId: number;
  requestId: string;
  reportId: string;
  workshopId?: string | null;
  workshopName?: string | null;
  overallSummary?: string | null;
  approvedAtIso: string;
  items: ReportItemRow[];
  /** Weighted grade from the signed-off section model (section-grade-from-items). */
  weighted?: ComputedGrade | null;
  /** Public share token; when present the report_url points at the public page. */
  publicToken?: string | null;
}): CoreReportSyncPayload {
  const base =
    process.env.INSPECTION_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    "https://inspect.dasm.com.sa";

  return {
    car_id: input.carId,
    inspection_request_id: input.requestId,
    inspection_report_id: input.reportId,
    workshop_id: input.workshopId ?? null,
    workshop_name: input.workshopName ?? null,
    overall_grade: gradeFromItems(input.items),
    summary: countSummary(input.items),
    overall_summary: input.overallSummary ?? null,
    report_url: input.publicToken
      ? `${base}/r/${input.publicToken}`
      : `${base}/reports/${input.reportId}`,
    approved_at: input.approvedAtIso,
    is_primary: true,
    final_score: input.weighted ? input.weighted.finalScore : null,
    grade_letter: input.weighted ? input.weighted.letterGrade : null,
    haraj_track: input.weighted ? input.weighted.auctionTrack : null,
    section_grades: input.weighted ? input.weighted.sectionScores : null,
  };
}

export function parseDasmCarId(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
