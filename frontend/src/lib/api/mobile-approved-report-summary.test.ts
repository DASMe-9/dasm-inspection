import { describe, expect, it } from "vitest";
import { toMobileApprovedReportSummary } from "./mobile-approved-report-summary";
import type { InspectionReport } from "@/types";

function baseReport(
  overrides: Partial<InspectionReport> = {}
): InspectionReport {
  return {
    id: "rep-1",
    requestId: "req-1",
    workshopId: "ws-1",
    inspectorId: "ins-1",
    overallSummary: "ملخص التقرير",
    items: [
      {
        id: "i1",
        section: "الفرامل والقياسات",
        label: "دواسة الفرامل / فرامل الدراجة النارية",
        status: "pass",
      },
    ],
    submittedAt: "2026-07-01T00:00:00Z",
    approvedAt: "2026-07-02T00:00:00Z",
    finalScore: 88.5,
    letterGrade: "B",
    harajTrack: "haraj_live",
    sectionGrades: { road_test: 100 },
    publicToken: "11111111-1111-4111-8111-111111111111",
    ...overrides,
  };
}

describe("toMobileApprovedReportSummary", () => {
  it("returns null when request is not approved", () => {
    expect(
      toMobileApprovedReportSummary(baseReport(), "pending_review")
    ).toBeNull();
  });

  it("returns null without approvedAt", () => {
    expect(
      toMobileApprovedReportSummary(
        baseReport({ approvedAt: undefined }),
        "approved"
      )
    ).toBeNull();
  });

  it("exposes persisted score fields and public URL", () => {
    const summary = toMobileApprovedReportSummary(baseReport(), "approved");
    expect(summary).toMatchObject({
      final_score: 88.5,
      letter_grade: "B",
      haraj_track: "haraj_live",
      overall_summary: "ملخص التقرير",
      public_token: "11111111-1111-4111-8111-111111111111",
      public_url:
        "https://inspect.dasm.com.sa/r/11111111-1111-4111-8111-111111111111",
    });
  });
});
