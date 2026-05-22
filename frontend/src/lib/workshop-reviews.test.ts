import { describe, expect, it } from "vitest";
import {
  averageWorkshopRating,
  isValidWorkshopRating,
  normalizeWorkshopReviewComment,
} from "@/lib/workshop-reviews";

describe("workshop-reviews", () => {
  it("validates rating range", () => {
    expect(isValidWorkshopRating(1)).toBe(true);
    expect(isValidWorkshopRating(5)).toBe(true);
    expect(isValidWorkshopRating(0)).toBe(false);
    expect(isValidWorkshopRating(6)).toBe(false);
  });

  it("trims and caps comment", () => {
    expect(normalizeWorkshopReviewComment("  مرحبا  ")).toBe("مرحبا");
    expect(normalizeWorkshopReviewComment("   ")).toBeNull();
  });

  it("computes average", () => {
    expect(averageWorkshopRating([4, 5])).toEqual({ average: 4.5, count: 2 });
    expect(averageWorkshopRating([])).toBeNull();
  });
});
