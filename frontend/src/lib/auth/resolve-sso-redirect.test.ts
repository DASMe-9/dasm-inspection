import { describe, expect, it } from "vitest";
import {
  buildPostSsoDestination,
  mapPlatformSsoRedirectPath,
  sanitizeInspectionRedirect,
} from "./resolve-sso-redirect";

/**
 * جدول الحمولات مطابق لجدوليه في
 * `DASM-Platform/backend/tests/Unit/Support/ServiceLaunchTest.php` و
 * `dasm-shipping/src/lib/service-launch.test.ts`. الثلاثة يطبّقون نفس القاعدة،
 * وأي تخفيف في واحد دون الآخرين يفتح ثغرة من جانب واحد.
 */
const OPEN_REDIRECT_PAYLOADS: Array<[name: string, payload: string]> = [
  ["absolute", "https://evil.test/x"],
  ["protocol-relative", "//evil.test"],
  ["backslash after the first slash", "/\\evil.test"],
  ["encoded double slash", "/%2F%2Fevil.test"],
  ["encoded backslash", "/%5Cevil.test"],
  ["encoded tab", "/%09/evil.test"],
  ["encoded CRLF", "/%0d%0aSet-Cookie:%20a=b"],
  ["encoded NUL", "/%00/evil.test"],
  ["double encoded", "/%252F%252Fevil.test"],
  ["traversal", "/../../etc/passwd"],
  ["encoded traversal", "/..%2f..%2fetc"],
  ["javascript", "javascript:alert(1)"],
  ["data", "data:text/html,<script>"],
  ["no leading slash", "requests"],
  ["empty", ""],
  ["raw space", "/requests a"],
  ["raw newline", "/requests\n/evil"],
];

describe("sanitizeInspectionRedirect", () => {
  it.each(OPEN_REDIRECT_PAYLOADS)("rejects %s", (_name, payload) => {
    expect(sanitizeInspectionRedirect(payload)).toBeNull();
  });

  it("accepts in-app paths", () => {
    expect(sanitizeInspectionRedirect("/requests")).toBe("/requests");
    expect(sanitizeInspectionRedirect("/track/42?x=1#top")).toBe("/track/42?x=1#top");
  });

  it("keeps encoded spaces but drops encoded control characters", () => {
    // The DASM dashboard sends labels such as "Camry 2020" percent-encoded.
    expect(sanitizeInspectionRedirect("/request?vehicle_label=Camry%202020")).not.toBeNull();

    for (const control of ["%00", "%09", "%0a", "%0d", "%1f", "%7f"]) {
      expect(sanitizeInspectionRedirect(`/request?q=a${control}b`)).toBeNull();
    }
  });

  it("does not throw on malformed percent encoding", () => {
    expect(() => sanitizeInspectionRedirect("/request/%zz")).not.toThrow();
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
