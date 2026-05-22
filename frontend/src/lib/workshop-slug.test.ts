import { describe, expect, it } from "vitest";
import { isWorkshopUuid, workshopSlugFromName } from "@/lib/workshop-slug";

describe("workshopSlugFromName", () => {
  it("builds ascii slug with id suffix", () => {
    const id = "11111111-1111-4111-8111-111111111101";
    expect(workshopSlugFromName("Gulf Workshop", id)).toBe(
      "gulf-workshop-11111111"
    );
  });

  it("falls back for arabic-only names", () => {
    const id = "11111111-1111-4111-8111-111111111102";
    expect(workshopSlugFromName("ورشة الخليج", id)).toBe(
      "workshop-11111111"
    );
  });
});

describe("isWorkshopUuid", () => {
  it("detects uuid v4", () => {
    expect(
      isWorkshopUuid("11111111-1111-4111-8111-111111111101")
    ).toBe(true);
    expect(isWorkshopUuid("not-a-slug")).toBe(false);
  });
});
