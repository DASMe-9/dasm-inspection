import "server-only";

import { cookies } from "next/headers";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { verifyDasmUserToken } from "@/lib/api/inspection-http-auth";

/**
 * معرّف مستخدم المنصّة، بالترتيب:
 * 1) سياق JWT المُتحقَّق (عند إنفاذ JWT)،
 * 2) كوكي البوابة (دخول SSO)،
 * 3) اشتقاق من توكن الدخول المباشر عبر /api/user/profile (مُتحقَّق من Core —
 *    آمن، لا انتحال؛ يعالج «لم نعثر على حسابك» للمستخدم الذي سجّل دخوله مباشرةً
 *    بلا مرور بالبوابة).
 */
export async function resolveDasmUserId(): Promise<string | null> {
  const ctx = await getInspectionAuthContext();
  if (ctx?.userId?.trim()) return ctx.userId.trim();

  const c = cookies();
  const cookieId = c.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim();
  if (cookieId) return cookieId;

  const token =
    c.get("dasm_access_token")?.value?.trim() ??
    c.get("inspection_token")?.value?.trim();
  if (!token) return null;

  const profile = await verifyDasmUserToken(token);
  return profile?.id?.trim() ? profile.id.trim() : null;
}
