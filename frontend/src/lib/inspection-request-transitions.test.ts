import { describe, expect, it } from "vitest";
import {
  canConfirmOnSite,
  canDispatchInspector,
  canStartInspection,
  effectiveServiceMode,
} from "@/lib/inspection-request-transitions";

describe("inspection-request-transitions", () => {
  it("defaults null service mode to workshop", () => {
    expect(effectiveServiceMode(null)).toBe("workshop");
    expect(effectiveServiceMode(undefined)).toBe("workshop");
  });

  it("workshop path starts from assigned", () => {
    expect(
      canStartInspection({ status: "assigned", serviceMode: "workshop" })
    ).toBe(true);
    expect(
      canStartInspection({ status: "dispatched", serviceMode: "workshop" })
    ).toBe(false);
  });

  it("field path requires on_site before start", () => {
    expect(
      canDispatchInspector({ status: "assigned", serviceMode: "field" })
    ).toBe(true);
    expect(
      canConfirmOnSite({ status: "dispatched", serviceMode: "field" })
    ).toBe(true);
    expect(
      canStartInspection({ status: "on_site", serviceMode: "field" })
    ).toBe(true);
    expect(
      canStartInspection({ status: "assigned", serviceMode: "field" })
    ).toBe(false);
  });
});
