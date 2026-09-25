import { describe, expect, it } from "vitest";
import { toMobileWorkshopRow } from "@/lib/api/mobile-workshop-row";
import type { Workshop } from "@/types";

const workshop: Workshop = {
  id: "workshop-1",
  slug: "center-1",
  name: "مركز الفحص الأول",
  city: "الرياض",
  isVerified: true,
  isSuspended: false,
  ratingSummary: { average: 4.7, count: 12 },
};

describe("toMobileWorkshopRow", () => {
  it("exposes only the moderated verified-review summary", () => {
    expect(toMobileWorkshopRow(workshop)).toMatchObject({
      rating_average: 4.7,
      rating_count: 12,
      is_verified: true,
    });
  });

  it("uses an explicit empty summary when no approved reviews exist", () => {
    expect(toMobileWorkshopRow({ ...workshop, ratingSummary: null })).toMatchObject({
      rating_average: null,
      rating_count: 0,
    });
  });
});
