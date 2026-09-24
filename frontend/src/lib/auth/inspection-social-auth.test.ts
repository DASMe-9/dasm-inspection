import { describe, expect, it } from "vitest";
import { buildGoogleRedirectUrl } from "./inspection-social-auth";

describe("inspection social return destinations", () => {
  it("returns web Google login to the DASM Inspection origin", () => {
    const url = new URL(
      buildGoogleRedirectUrl(
        "https://inspect.dasm.com.sa",
        "https://api.dasm.com.sa",
      ),
    );

    expect(url.origin).toBe("https://api.dasm.com.sa");
    expect(url.pathname).toBe("/api/auth/google/redirect");
    expect(url.searchParams.get("return")).toBe(
      "https://inspect.dasm.com.sa",
    );
  });
});
