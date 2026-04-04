import * as jose from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyDasmJwt } from "./verify-dasm-jwt";

describe("verifyDasmJwt (HS256)", () => {
  const secret = "unit-test-secret-at-least-32-characters-long";

  beforeEach(() => {
    process.env.DASM_JWT_ISSUER = "https://issuer.dasm.test";
    process.env.DASM_JWT_AUDIENCE = "inspection-staging";
    process.env.DASM_JWT_SECRET = secret;
    delete process.env.DASM_JWKS_URI;
  });

  afterEach(() => {
    delete process.env.DASM_JWT_ISSUER;
    delete process.env.DASM_JWT_AUDIENCE;
    delete process.env.DASM_JWT_SECRET;
  });

  it("allows valid token and normalizes claims", async () => {
    const token = await new jose.SignJWT({
      sub: "user-42",
      inspection_role: "inspector",
      workshop_id: "11111111-1111-4111-8111-111111111101",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("https://issuer.dasm.test")
      .setAudience("inspection-staging")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

    const r = await verifyDasmJwt(token);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized.userId).toBe("user-42");
      expect(r.normalized.inspectionRole).toBe("inspector");
    }
  });

  it("rejects wrong issuer", async () => {
    const token = await new jose.SignJWT({ sub: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("https://evil.test")
      .setAudience("inspection-staging")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

    const r = await verifyDasmJwt(token);
    expect(r.ok).toBe(false);
  });

  it("rejects expired token", async () => {
    const token = await new jose.SignJWT({ sub: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("https://issuer.dasm.test")
      .setAudience("inspection-staging")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(secret));

    const r = await verifyDasmJwt(token);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid");
  });
});
