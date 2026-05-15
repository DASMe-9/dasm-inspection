import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;

/** طوابع زمنية لكل دلو؛ أفضل جهد على دوال بدون حالة مشتركة قوية بين المناطق. */
const buckets = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function apiKeyFingerprint(request: NextRequest): string {
  const raw =
    request.headers.get("x-dasm-api-key") ||
    request.headers
      .get("authorization")
      ?.replace(/^ApiKey\s+/i, "")
      .trim() ||
    "";
  if (!raw) return "none";
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function prune(ts: number[]) {
  const cutoff = Date.now() - WINDOW_MS;
  while (ts.length > 0 && ts[0]! < cutoff) ts.shift();
}

export type InspectionCreateRateLimitMode = "gateway" | "v1";

/**
 * يستهلك حصّة طلب ضمن نافذة دقيقة واحدة لكل مفتاح API (بصمة) + عنوان عميل.
 * `INSPECTION_CREATE_RATE_LIMIT_PER_MIN`: عدد الطلبات المسموحة؛ ≤0 أو غير رقم يعطّل الحد.
 */
export function consumeInspectionCreateRateLimit(
  request: NextRequest
): { ok: true } | { ok: false; retryAfterSec: number } {
  const raw = process.env.INSPECTION_CREATE_RATE_LIMIT_PER_MIN;
  const limit = raw == null || raw === "" ? 60 : Number(raw);
  if (!Number.isFinite(limit) || limit <= 0) {
    return { ok: true };
  }

  const key = `${apiKeyFingerprint(request)}:${clientIp(request)}`;
  let ts = buckets.get(key);
  if (!ts) {
    ts = [];
    buckets.set(key, ts);
  }
  prune(ts);
  if (ts.length >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((ts[0]! + WINDOW_MS - Date.now()) / 1000)
    );
    return { ok: false, retryAfterSec };
  }
  ts.push(Date.now());
  return { ok: true };
}

export function inspectionCreateRateLimitResponse(
  mode: InspectionCreateRateLimitMode,
  retryAfterSec: number
): NextResponse {
  const headers = new Headers({ "Retry-After": String(retryAfterSec) });
  const message = `تم تجاوز الحد المسموح لإنشاء الطلبات. أعد المحاولة بعد ${retryAfterSec} ثانية.`;
  if (mode === "gateway") {
    return NextResponse.json({ success: false, message }, { status: 429, headers });
  }
  return NextResponse.json(
    { error: "rate_limited", message, retry_after: retryAfterSec },
    { status: 429, headers }
  );
}
