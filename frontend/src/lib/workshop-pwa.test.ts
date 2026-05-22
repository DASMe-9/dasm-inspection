import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("workshop PWA manifest", () => {
  it("targets workshop dashboard as start_url", () => {
    const m = manifest();
    expect(m.start_url).toBe("/workshop");
    expect(m.display).toBe("standalone");
    expect(m.short_name).toBe("ورشتي");
  });

  it("includes workshop shortcuts", () => {
    const m = manifest();
    const urls = (m.shortcuts ?? []).map((s) => s.url);
    expect(urls).toContain("/requests");
    expect(urls).toContain("/workshop/field");
  });
});
