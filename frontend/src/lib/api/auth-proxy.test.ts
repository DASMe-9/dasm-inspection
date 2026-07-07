import { describe, it, expect } from "vitest";
import { isAuthRequestAllowed } from "./auth-proxy-rate";

describe("isAuthRequestAllowed", () => {
  it("allows while under the limit", () => {
    expect(isAuthRequestAllowed(0, 20)).toBe(true);
    expect(isAuthRequestAllowed(19, 20)).toBe(true);
  });

  it("blocks at or above the limit", () => {
    expect(isAuthRequestAllowed(20, 20)).toBe(false);
    expect(isAuthRequestAllowed(21, 20)).toBe(false);
  });

  it("treats limit <= 0 as disabled (always allowed)", () => {
    expect(isAuthRequestAllowed(999, 0)).toBe(true);
    expect(isAuthRequestAllowed(999, -1)).toBe(true);
  });
});
