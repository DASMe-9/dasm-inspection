import { computeGradeFromReportItems } from "@/lib/inspection/section-grade-from-items";
import type { InspectionReport } from "@/types";

const PUBLIC_BASE =
  process.env.INSPECTION_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  "https://inspect.dasm.com.sa";

/** Customer-facing approved-report summary for the mobile track screen. */
export function toMobileApprovedReportSummary(
  report: InspectionReport | null | undefined,
  requestStatus: string
) {
  if (!report || requestStatus !== "approved" || !report.approvedAt) {
    return null;
  }

  let finalScore = report.finalScore ?? null;
  let letterGrade = report.letterGrade ?? null;
  let harajTrack = report.harajTrack ?? null;
  let sectionScores = report.sectionGrades ?? null;

  if (finalScore == null || letterGrade == null || harajTrack == null) {
    const computed = computeGradeFromReportItems(report.items);
    finalScore = finalScore ?? computed.finalScore;
    letterGrade = letterGrade ?? computed.letterGrade;
    harajTrack = harajTrack ?? computed.auctionTrack;
    sectionScores = sectionScores ?? computed.sectionScores;
  }

  const token = report.publicToken?.trim() || null;
  return {
    final_score: finalScore,
    letter_grade: letterGrade,
    haraj_track: harajTrack,
    overall_summary: report.overallSummary?.trim() || null,
    approved_at: report.approvedAt,
    public_token: token,
    public_url: token ? `${PUBLIC_BASE}/r/${token}` : null,
    section_scores: sectionScores,
  };
}
