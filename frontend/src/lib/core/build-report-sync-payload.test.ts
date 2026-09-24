import { describe, expect, it } from "vitest";
import { buildReportSyncPayload } from "./build-report-sync-payload";

describe("buildReportSyncPayload", () => {
  it("uses Core's section_scores contract for the vehicle report", () => {
    const payload = buildReportSyncPayload({
      carId: 42,
      requestId: "11111111-1111-4111-8111-111111111111",
      reportId: "22222222-2222-4222-8222-222222222222",
      approvedAtIso: "2026-09-25T00:00:00.000Z",
      items: [{ status: "pass" }],
      weighted: {
        finalScore: 92,
        letterGrade: "A",
        auctionTrack: "haraj_live",
        sectionScores: { engine: 95, body_paint: 88 },
      },
    });

    expect(payload.section_scores).toEqual({ engine: 95, body_paint: 88 });
    expect(payload).not.toHaveProperty("section_grades");
  });
});
