import { describe, expect, it } from "vitest";
import { compareWorkshopOffers } from "@/lib/workshop-offer-comparison";

const workshops = [
  { id: "b", name: "ورشة ب", pricing: { workshopSar: 450, fieldSar: 650, currency: "SAR" } },
  { id: "a", name: "ورشة أ", pricing: { workshopSar: 300, fieldSar: 700, currency: "SAR" } },
  { id: "c", name: "ورشة ج", pricing: null },
];

describe("compareWorkshopOffers", () => {
  it("orders workshop service offers from lowest price and keeps unavailable last", () => {
    expect(compareWorkshopOffers(workshops, "workshop").map((offer) => offer.workshop.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("compares the selected service mode independently", () => {
    expect(compareWorkshopOffers(workshops, "field").map((offer) => offer.workshop.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});
