import type { NextRequest } from "next/server";

export const DASM_API_URL =
  process.env.DASM_API_URL || "https://api.dasm.com.sa";

export function getValidGatewayApiKeys(): string[] {
  return (process.env.DASM_GATEWAY_API_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** مصادقة تكامل المنصّة: مفتاح الخدمة في الرأس (كما في POST /api/gateway). */
export function verifyGatewayApiKey(request: NextRequest): boolean {
  const apiKey =
    request.headers.get("X-Dasm-Api-Key") ||
    request.headers.get("Authorization")?.replace(/^ApiKey\s+/i, "");
  if (!apiKey) return false;
  return getValidGatewayApiKeys().includes(apiKey);
}

export function getBearerToken(request: NextRequest): string | null {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

export type DasmProfileUser = {
  id: string;
  name?: string;
  /** دور واجهة الفحص إنْ أعادته المنصّة (اختياري). */
  inspectionRole?: string | null;
};

export async function verifyDasmUserToken(
  token: string
): Promise<DasmProfileUser | null> {
  try {
    const res = await fetch(`${DASM_API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const u = data?.data ?? data;
    if (u?.id == null) return null;
    const rawRole =
      (typeof u.inspection_role === "string" && u.inspection_role) ||
      (typeof u.inspection_app_role === "string" && u.inspection_app_role) ||
      null;
    return {
      id: String(u.id),
      name: u.name,
      inspectionRole: rawRole?.trim() ? rawRole.trim() : null,
    };
  } catch {
    return null;
  }
}
