import { describe, expect, it } from "vitest";
import {
  buildPostSsoDestination,
  mapPlatformSsoRedirectPath,
  sanitizeInspectionRedirect,
} from "./resolve-sso-redirect";

describe("sanitizeInspectionRedirect", () => {
  it("rejects absolute and protocol-relative paths", () => {
    expect(sanitizeInspectionRedirect("https://evil.test/x")).toBeNull();
    expect(sanitizeInspectionRedirect("//evil.test")).toBeNull();
  });

  it("accepts in-app paths", () => {
    expect(sanitizeInspectionRedirect("/requests")).toBe("/requests");
  });
});

describe("mapPlatformSsoRedirectPath", () => {
  it("maps dashboard shortcuts to inspection routes", () => {
    expect(mapPlatformSsoRedirectPath("/request")).toBe("/requests");
    expect(mapPlatformSsoRedirectPath("/tracking?id=42")).toBe("/track/42");
    expect(mapPlatformSsoRedirectPath("/workshops")).toBe("/workshops");
  });
});

describe("buildPostSsoDestination", () => {
  it("adds gateway query for dasm_user on requests", () => {
    const dest = buildPostSsoDestination(
      "/request",
      { type: "user" },
      "99",
      "Ali Test"
    );
    expect(dest).toContain("/requests");
    expect(dest).toContain("gateway=dasm");
    expect(dest).toContain("dasm_user_id=99");
  });

  it("keeps admin paths without gateway params", () => {
    const dest = buildPostSsoDestination(
      "/requests",
      { type: "admin" },
      "1",
      ""
    );
    expect(dest).toBe("/requests");
  });
});
