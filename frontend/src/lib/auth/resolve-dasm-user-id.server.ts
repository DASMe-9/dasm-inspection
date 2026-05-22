import "server-only";

import { cookies } from "next/headers";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";

/** معرّف مستخدم المنصّة من JWT (إن وُجد) أو كوكي البوابة. */
export async function resolveDasmUserId(): Promise<string | null> {
  const ctx = await getInspectionAuthContext();
  if (ctx?.userId?.trim()) return ctx.userId.trim();
  const c = cookies();
  return c.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? null;
}
