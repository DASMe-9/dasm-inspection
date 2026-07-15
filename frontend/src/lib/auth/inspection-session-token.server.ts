import "server-only";

import { cookies } from "next/headers";

/**
 * يقرأ توكن جلسة الفحص (Sanctum/JWT) من الكوكي لاستدعاء واجهات Core.
 */
export async function getInspectionBearerToken(): Promise<string | null> {
  const store = await cookies();
  const primary = process.env.DASM_JWT_COOKIE_NAME || "dasm_access_token";
  const raw =
    store.get(primary)?.value ?? store.get("inspection_token")?.value ?? null;
  if (!raw?.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}
