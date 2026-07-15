import { describe, expect, it } from "vitest";
import { mapsUrlFromNationalAddress, normalizeNationalAddressCode } from "./workshop-location";

describe("workshop-location", () => {
  it("normalizes national address codes", () => {
    expect(normalizeNationalAddressCode(" rr rd 2929 ")).toBe("RRRD2929");
    expect(normalizeNationalAddressCode("   ")).toBeNull();
  });

  it("builds a maps URL from the national address", () => {
    expect(mapsUrlFromNationalAddress("RRRD2929")).toBe(
      "https://www.google.com/maps/search/?api=1&query=RRRD2929"
    );
    expect(mapsUrlFromNationalAddress("")).toBeNull();
  });
});
