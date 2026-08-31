import { describe, expect, it, vi } from "vitest";
import type { PublicReportView } from "@/lib/data/inspection";

vi.mock("server-only", () => ({}));

const data = vi.hoisted(() => ({
  report: null as PublicReportView | null,
}));

vi.mock("@/lib/data/inspection", () => ({
  getPublicReportByToken: vi.fn(async () => data.report),
}));

import { GET } from "./route";

function req(token: string) {
  return GET(new Request(`https://x.test/api/r/${token}/pdf`), {
    params: Promise.resolve({ token }),
  });
}

describe("GET /api/r/[token]/pdf", () => {
  it("404s for a token with no approved report, same as the page route", async () => {
    data.report = null;
    const res = await req("missing-token");
    expect(res.status).toBe(404);
  });

  it("streams a real PDF for an approved report", async () => {
    data.report = {
      workshopName: "ورشة الرياض للفحص الفني",
      approvedAt: "2026-08-01T00:00:00Z",
      overallSummary: "السيارة بحالة جيدة عموماً.",
      finalScore: 87.5,
      letterGrade: "B",
      harajTrack: "instant",
      items: [
        { id: "1", section: "المحرك", label: "زيت المحرك", status: "pass", notes: null },
        { id: "2", section: "المحرك", label: "سير المحرك", status: "warn", notes: "قريب من الاستبدال" },
      ],
    };

    const res = await req("abc-123");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");

    const bytes = new Uint8Array(await res.arrayBuffer());
    const header = Buffer.from(bytes.slice(0, 5)).toString("ascii");
    expect(header).toBe("%PDF-");
  });
});
