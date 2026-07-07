import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { authProxyLimitPerMin, isAuthRequestAllowed } from "@/lib/api/auth-proxy-rate";

const DASM_API =
  process.env.DASM_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dasm.com.sa";

const WINDOW_MS = 60_000;

/** طوابع زمنية لكل عنوان عميل (أفضل جهد؛ الحماية الحقيقية عند Core أيضًا). */
const buckets = new Map<string, number[]>();

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function clientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function consumeRateLimit(
  request: NextRequest
): { ok: true } | { ok: false; retryAfterSec: number } {
  const limit = authProxyLimitPerMin();
  const now = Date.now();
  const key = clientIp(request);
  let ts = buckets.get(key);
  if (!ts) {
    ts = [];
    buckets.set(key, ts);
  }
  const cutoff = now - WINDOW_MS;
  while (ts.length > 0 && ts[0]! < cutoff) ts.shift();

  if (!isAuthRequestAllowed(ts.length, limit)) {
    const retryAfterSec = Math.max(1, Math.ceil((ts[0]! + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  ts.push(now);
  return { ok: true };
}

/**
 * وكيل موحّد لتمرير طلبات المصادقة إلى DASM Core من نفس الأصل.
 * يضيف: حدّ معدّل لكل عنوان (ضد التخمين) + تسجيل أخطاء المنبع (بدل الابتلاع الصامت).
 * لا يسجّل الجسم إطلاقًا (اعتمادات) — معرّفات فقط.
 */
export async function proxyAuthToCore(
  request: NextRequest,
  corePath: string,
  invalidMessage: string
): Promise<NextResponse> {
  const rl = consumeRateLimit(request);
  if (!rl.ok) {
    inspectionOpsLog("warn", "auth_proxy_rate_limited", { core_path: corePath });
    return NextResponse.json(
      {
        message: `محاولات كثيرة. أعد المحاولة بعد ${rl.retryAfterSec} ثانية.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: invalidMessage }, { status: 400 });
  }

  try {
    const res = await fetch(`${normalizeBaseUrl(DASM_API)}${corePath}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = await res.json().catch(() => {
      inspectionOpsLog("warn", "auth_proxy_bad_upstream_json", {
        core_path: corePath,
        status: res.status,
      });
      return {};
    });

    if (!res.ok) {
      inspectionOpsLog("warn", "auth_proxy_upstream_error", {
        core_path: corePath,
        status: res.status,
      });
    }

    return NextResponse.json(body, { status: res.status });
  } catch (e) {
    inspectionOpsLog("error", "auth_proxy_network_error", {
      core_path: corePath,
      message: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json(
      { message: "تعذّر الوصول لخدمة المصادقة. أعد المحاولة." },
      { status: 502 }
    );
  }
}
