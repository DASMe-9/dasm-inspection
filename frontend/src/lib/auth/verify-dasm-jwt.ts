import * as jose from "jose";
import { normalizeInspectionClaims, type NormalizedInspectionClaims } from "./normalize-claims";

export type DasmJwtVerifyFailure = { ok: false; code: "config" | "invalid"; message: string };

export type DasmJwtVerifySuccess = {
  ok: true;
  payload: jose.JWTPayload;
  normalized: NormalizedInspectionClaims;
};

export type DasmJwtVerifyResult = DasmJwtVerifySuccess | DasmJwtVerifyFailure;

let jwks: jose.JWTVerifyGetKey | undefined;

function getJwks(): jose.JWTVerifyGetKey {
  if (!jwks) {
    const uri = process.env.DASM_JWKS_URI;
    if (!uri) throw new Error("DASM_JWKS_URI not set");
    jwks = jose.createRemoteJWKSet(new URL(uri));
  }
  return jwks;
}

/**
 * يتحقق من توقيع ومدة JWT وiss (وaud إن وُجدت).
 * HS256 عبر DASM_JWT_SECRET أو RS256/ES256 عبر DASM_JWKS_URI.
 */
export async function verifyDasmJwt(token: string): Promise<DasmJwtVerifyResult> {
  const issuer = process.env.DASM_JWT_ISSUER?.trim();
  if (!issuer) {
    return { ok: false, code: "config", message: "DASM_JWT_ISSUER is required when enforcing JWT" };
  }

  const audienceRaw = process.env.DASM_JWT_AUDIENCE?.trim();
  const audience = audienceRaw || undefined;

  const secret = process.env.DASM_JWT_SECRET?.trim();
  const jwksUri = process.env.DASM_JWKS_URI?.trim();

  const verifyOptions: jose.JWTVerifyOptions = { issuer, audience };

  try {
    let payload: jose.JWTPayload;

    if (secret) {
      const key = new TextEncoder().encode(secret);
      ({ payload } = await jose.jwtVerify(token, key, verifyOptions));
    } else if (jwksUri) {
      ({ payload } = await jose.jwtVerify(token, getJwks(), verifyOptions));
    } else {
      return {
        ok: false,
        code: "config",
        message: "Set DASM_JWT_SECRET (HS256) or DASM_JWKS_URI (asymmetric)",
      };
    }

    return {
      ok: true,
      payload,
      normalized: normalizeInspectionClaims(payload),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid token";
    return { ok: false, code: "invalid", message };
  }
}
