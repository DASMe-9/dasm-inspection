import type { NextRequest } from "next/server";

/** يقرأ Bearer أولاً ثم الكوكي المعرّفة في DASM_JWT_COOKIE_NAME (افتراضيًا dasm_access_token). */
export function extractDasmBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    return t || null;
  }
  const cookieName = process.env.DASM_JWT_COOKIE_NAME || "dasm_access_token";
  const fromCookie = request.cookies.get(cookieName)?.value;
  return fromCookie?.trim() || null;
}
