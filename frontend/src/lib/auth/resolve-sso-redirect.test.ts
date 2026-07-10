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

  it("preserves car prefill query when mapping /request → /requests", () => {
    const mapped = mapPlatformSsoRedirectPath(
      "/request?dasm_car_id=77&vehicle_label=Camry%202020"
    );
    expect(mapped).toContain("/requests?");
    expect(mapped).toContain("dasm_car_id=77");
    expect(mapped).toContain("vehicle_label=Camry");
  });
});

describe("buildPostSsoDestination with car prefill", () => {
  it("keeps dasm_car_id on gateway destination for dasm_user", () => {
    const dest = buildPostSsoDestination(
      "/request?dasm_car_id=55&vehicle_label=Elantra%202021",
      { type: "user" },
      "99",
      "Ali"
    );
    expect(dest).toContain("/requests?");
    expect(dest).toContain("dasm_car_id=55");
    expect(dest).toContain("vehicle_label=Elantra");
    expect(dest).toContain("gateway=dasm");
    expect(dest).toContain("dasm_user_id=99");
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
