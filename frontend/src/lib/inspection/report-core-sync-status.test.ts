import { describe, it, expect } from "vitest";
import { mapSyncResultToStatus } from "./report-core-sync-status";

describe("mapSyncResultToStatus", () => {
  it("maps a successful push to 'synced'", () => {
    expect(mapSyncResultToStatus({ ok: true })).toBe("synced");
  });

  it("maps a skipped push (missing token / sync disabled) to 'skipped'", () => {
    expect(mapSyncResultToStatus({ ok: false, skipped: true })).toBe("skipped");
    expect(mapSyncResultToStatus({ ok: true, skipped: true })).toBe("synced");
  });

  it("maps a genuine failure (http/network error) to 'failed'", () => {
    expect(mapSyncResultToStatus({ ok: false })).toBe("failed");
    expect(mapSyncResultToStatus({ ok: false, skipped: false })).toBe("failed");
  });
});
