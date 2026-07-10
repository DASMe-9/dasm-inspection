import { describe, expect, it } from "vitest";
import {
  applyHiddenNavKeys,
  parseHiddenNavKeys,
} from "./workshop-nav-preferences";
import { visibleNavKeys } from "./resolve-inspection-persona";

describe("workshop-nav-preferences", () => {
  it("parses only customizable keys", () => {
    expect(parseHiddenNavKeys(["wallet", "bogus", "settings"])).toEqual([
      "wallet",
      "settings",
    ]);
  });

  it("hides keys from workshop owner nav", () => {
    const base = visibleNavKeys("workshop_owner");
    const next = applyHiddenNavKeys(base, ["wallet", "subscription"]);
    expect(next.has("workshop_dashboard")).toBe(true);
    expect(next.has("wallet")).toBe(false);
    expect(next.has("subscription")).toBe(false);
    expect(next.has("requests")).toBe(true);
  });
});
