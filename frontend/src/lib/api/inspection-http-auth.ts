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
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userCode?: string | null;
  displayLocation?: string | null;
  address?: {
    areaLabel?: string | null;
    city?: string | null;
  } | null;
  /** نوع حساب DASM (مثل admin، venue_owner، user). */
  type?: string | null;
  /** دور واجهة الفحص إنْ أعادته المنصّة (اختياري). */
  inspectionRole?: string | null;
};

function mapProfilePayload(u: Record<string, unknown>): DasmProfileUser | null {
  if (u?.id == null) return null;
  const rawRole =
    (typeof u.inspection_role === "string" && u.inspection_role) ||
    (typeof u.inspection_app_role === "string" && u.inspection_app_role) ||
    null;
  const rawType =
    (typeof u.type === "string" && u.type) ||
    (typeof u.user_type === "string" && u.user_type) ||
    null;
  const addr =
    u.address && typeof u.address === "object" && !Array.isArray(u.address)
      ? (u.address as Record<string, unknown>)
      : null;

  return {
    id: String(u.id),
    name: typeof u.name === "string" ? u.name : undefined,
    firstName: typeof u.first_name === "string" ? u.first_name : null,
    lastName: typeof u.last_name === "string" ? u.last_name : null,
    email: typeof u.email === "string" ? u.email : null,
    userCode: typeof u.user_code === "string" ? u.user_code : null,
    displayLocation:
      typeof u.display_location === "string" ? u.display_location : null,
    address: addr
      ? {
          areaLabel:
            typeof addr.area_label === "string" ? addr.area_label : null,
          city: typeof addr.city === "string" ? addr.city : null,
        }
      : null,
    type: rawType?.trim() ? rawType.trim() : null,
    inspectionRole: rawRole?.trim() ? rawRole.trim() : null,
  };
}

export async function fetchDasmUserProfile(
  token: string
): Promise<DasmProfileUser | null> {
  try {
    const res = await fetch(`${DASM_API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const u = (data?.data ?? data) as Record<string, unknown>;
    return mapProfilePayload(u);
  } catch {
    return null;
  }
}

export async function verifyDasmUserToken(
  token: string
): Promise<DasmProfileUser | null> {
  return fetchDasmUserProfile(token);
}
