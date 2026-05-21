import { describe, expect, it } from "vitest";
import {
  buildWorkshopPricingMap,
  resolveWorkshopServicePrice,
} from "@/lib/inspection-pricing";

describe("inspection-pricing", () => {
  const rows = [
    { workshop_id: null, service_mode: "workshop" as const, price_sar: 350, currency: "SAR" },
    { workshop_id: null, service_mode: "field" as const, price_sar: 550, currency: "SAR" },
    {
      workshop_id: "w1",
      service_mode: "workshop" as const,
      price_sar: 300,
      currency: "SAR",
    },
  ];

  it("resolves workshop override before platform default", () => {
    const map = buildWorkshopPricingMap(rows);
    const r = resolveWorkshopServicePrice("w1", "workshop", map);
    expect(r.amountSar).toBe(300);
    expect(r.source).toBe("workshop");
  });

  it("falls back to platform when workshop has no field price", () => {
    const map = buildWorkshopPricingMap(rows);
    const r = resolveWorkshopServicePrice("w1", "field", map);
    expect(r.amountSar).toBe(550);
    expect(r.source).toBe("platform");
  });

  it("returns none when no catalog rows", () => {
    const map = buildWorkshopPricingMap([]);
    const r = resolveWorkshopServicePrice("w1", "workshop", map);
    expect(r.amountSar).toBeNull();
    expect(r.source).toBe("none");
  });
});
