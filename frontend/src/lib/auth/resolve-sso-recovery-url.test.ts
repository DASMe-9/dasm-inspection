import { describe, expect, it } from "vitest";

import { resolveSsoRecoveryUrl } from "./resolve-sso-recovery-url";

describe("resolveSsoRecoveryUrl", () => {
  it("keeps the canonical Core workshop launcher", () => {
    expect(
      resolveSsoRecoveryUrl("https://www.dasm.com.sa/workshop")
    ).toBe("https://www.dasm.com.sa/workshop");
  });

  it("accepts a relative workshop launcher", () => {
    expect(resolveSsoRecoveryUrl("/workshop")).toBe(
      "https://www.dasm.com.sa/workshop"
    );
  });

  it("rejects external and non-workshop redirects", () => {
    expect(resolveSsoRecoveryUrl("https://evil.example/workshop")).toBe(
      "https://www.dasm.com.sa/workshop"
    );
    expect(resolveSsoRecoveryUrl("https://www.dasm.com.sa/admin")).toBe(
      "https://www.dasm.com.sa/workshop"
    );
  });
});
