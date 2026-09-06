import { describe, expect, it } from "vitest";
import { isOptimizableWorkshopImageUrl } from "./workshop-showcase";

describe("isOptimizableWorkshopImageUrl", () => {
  it("allows secure Cloudinary delivery URLs", () => {
    expect(
      isOptimizableWorkshopImageUrl(
        "https://res.cloudinary.com/dasm/image/upload/workshops/demo/logo.jpg"
      )
    ).toBe(true);
  });

  it("keeps arbitrary and insecure hosts away from the image optimizer", () => {
    expect(isOptimizableWorkshopImageUrl("https://example.com/photo.jpg")).toBe(
      false
    );
    expect(
      isOptimizableWorkshopImageUrl(
        "http://res.cloudinary.com/dasm/image/upload/photo.jpg"
      )
    ).toBe(false);
  });
});
