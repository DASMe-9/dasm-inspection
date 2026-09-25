import { describe, expect, it } from "vitest";
import { derivePurchaseDecision } from "./purchase-decision";

describe("derivePurchaseDecision", () => {
  it("marks an all-pass report as suitable", () => {
    expect(derivePurchaseDecision([{ status: "pass" }, { status: "na" }]).code)
      .toBe("suitable");
  });

  it("marks warnings as requiring negotiation", () => {
    expect(derivePurchaseDecision([{ status: "pass" }, { status: "warn" }]).code)
      .toBe("negotiate");
  });

  it("marks any failed item as high risk", () => {
    expect(derivePurchaseDecision([{ status: "warn" }, { status: "fail" }]).code)
      .toBe("high_risk");
  });

  it("does not mark an empty or not-applicable report as suitable", () => {
    expect(derivePurchaseDecision([]).code).toBe("negotiate");
    expect(derivePurchaseDecision([{ status: "na" }]).code).toBe("negotiate");
  });
});
