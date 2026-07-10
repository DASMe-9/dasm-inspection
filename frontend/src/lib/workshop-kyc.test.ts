import { describe, expect, it } from "vitest";
import { evaluateWorkshopKyc, normalizeSaudiIban } from "./workshop-kyc";

describe("normalizeSaudiIban", () => {
  it("accepts valid SA IBAN", () => {
    expect(normalizeSaudiIban("SA03 8000 0000 6080 1016 7519")).toBe(
      "SA0380000000608010167519"
    );
  });

  it("rejects invalid IBAN", () => {
    expect(normalizeSaudiIban("1234")).toBeNull();
  });
});

describe("evaluateWorkshopKyc", () => {
  it("flags missing payout fields", () => {
    const s = evaluateWorkshopKyc({
      ownerUserId: "42",
      commercialRegistration: "",
      bankIban: "",
      bankBeneficiaryName: "",
    });
    expect(s.complete).toBe(false);
    expect(s.missing).toContain("السجل التجاري");
    expect(s.missing).toContain("رقم الآيبان");
  });

  it("marks complete when all fields present", () => {
    const s = evaluateWorkshopKyc({
      ownerUserId: "42",
      commercialRegistration: "1010123456",
      bankIban: "SA0380000000608010167519",
      bankBeneficiaryName: "ورشة الاختبار",
    });
    expect(s.complete).toBe(true);
    expect(s.missing).toHaveLength(0);
  });
});
