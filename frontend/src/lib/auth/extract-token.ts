import type { NextRequest } from "next/server";

/** يقرأ Bearer أولاً ثم الكوكي المعرّفة في DASM_JWT_COOKIE_NAME (افتراضيًا dasm_access_token). */
export function extractDasmBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    return t || null;
  }
  const cookieName = process.env.DASM_JWT_COOKIE_NAME || "dasm_access_token";
  const raw =
    request.cookies.get(cookieName)?.value ??
    request.cookies.get("inspection_token")?.value;
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}
