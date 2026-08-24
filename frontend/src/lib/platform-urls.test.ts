import { describe, expect, it } from "vitest";

import { getShipmentLaunchUrl } from "./platform-urls";

const params = (url: string) => new URL(url).searchParams;

describe("getShipmentLaunchUrl", () => {
  it("targets the DASM bridge, never a shipping domain directly", () => {
    const url = new URL(getShipmentLaunchUrl({ kind: "transport" }));

    expect(url.pathname).toBe("/shipping/launch");
    expect(url.hostname.endsWith("dasm.com.sa")).toBe(true);
    // Only the bridge knows the approved shipping domain
    // (backend/config/service_launch.php).
    expect(url.href).not.toContain("ship.dasm.com.sa");
  });

  it("always tags the source as inspection", () => {
    expect(params(getShipmentLaunchUrl({ kind: "transport" })).get("source")).toBe("inspection");
  });

  it("carries the kind and the reference", () => {
    const qs = params(getShipmentLaunchUrl({ ref: "REQ-42", kind: "parcel" }));

    expect(qs.get("kind")).toBe("parcel");
    expect(qs.get("ref")).toBe("REQ-42");
  });

  /**
   * The bridge drops anything outside [A-Za-z0-9_-] regardless; not sending it
   * keeps both ends honest about the contract instead of leaning on the far
   * side to clean up.
   */
  it("drops a reference that does not match the contract", () => {
    for (const hostile of ["<script>", "a/b", "a b", "../../etc", "x".repeat(65), "", null]) {
      expect(params(getShipmentLaunchUrl({ ref: hostile, kind: "transport" })).has("ref")).toBe(false);
    }
  });

  it("passes prefill values and skips blank ones", () => {
    const qs = params(
      getShipmentLaunchUrl({
        kind: "transport",
        prefill: { title: "كامري 2020", city: "  ", empty: null },
      }),
    );

    expect(qs.get("prefill_title")).toBe("كامري 2020");
    expect(qs.has("prefill_city")).toBe(false);
    expect(qs.has("prefill_empty")).toBe(false);
  });

  /** The whole path rides in return_url through the shipping landing guard. */
  it("produces a parseable URL with no control characters", () => {
    const url = getShipmentLaunchUrl({
      ref: "REQ-1",
      kind: "transport",
      prefill: { title: "كامري 2020" },
    });

    expect(() => new URL(url)).not.toThrow();
    expect(url).not.toMatch(/[\u0000-\u0020\\]/);
  });
});
