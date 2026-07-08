/**
 * بوابة الفحص من DASM Platform
 *
 * GET /api/gateway?token=xxx → يوجه المستخدم لصفحة طلب الفحص
 * POST /api/gateway → ينشئ طلب فحص عبر API key (يُفضّل للمنصّات الجديدة استخدام POST /api/v1/inspection-requests)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  setInspectionGatewayCookies,
  setInspectionSessionCookies,
} from "@/lib/cookies/set-inspection-gateway-cookies";
import {
  verifyGatewayApiKey,
  getBearerToken,
  verifyDasmUserToken,
  DASM_API_URL,
} from "@/lib/api/inspection-http-auth";
import { resolveInspectionRoleFromPlatformUser } from "@/lib/auth/platform-inspection-role";
import { insertInspectionRequestSubmitted } from "@/lib/api/inspection-request-http";
import {
  consumeInspectionCreateRateLimit,
  inspectionCreateRateLimitResponse,
} from "@/lib/api/inspection-create-rate-limit";

/**
 * GET — توجيه المستخدم من DASM إلى منصة الفحص
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const returnUrl = searchParams.get("return_url") || "";

  if (!token) {
    return NextResponse.json(
      { success: false, message: "token مطلوب" },
      { status: 400 }
    );
  }

  // Establish a real session, not just identity cookies. The protected (main)
  // layout requires a dasm_access_token/inspection_token cookie; without it the
  // handoff bounced to the login page. Exchange the single-use SSO token for a
  // 30-day session token and set that cookie so the SPA lands authenticated
  // (mirrors POST /api/auth/sso-callback, but as a browser-navigable GET).
  let sessionToken: string | null = null;
  let userId = "";
  let userName = "";
  let inspectionRole: string | null = null;

  try {
    const verifyRes = await fetch(
      `${DASM_API_URL.replace(/\/+$/, "")}/api/sso/verify`,
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ sso_token: token, platform: "inspection" }),
        cache: "no-store",
      }
    );
    if (verifyRes.ok) {
      const body = await verifyRes.json().catch(() => ({}));
      const access = body?.data?.access_token as string | undefined;
      const u = body?.data?.user as
        | { id?: string | number; first_name?: string | null; last_name?: string | null; type?: string | null }
        | undefined;
      if (access && u?.id != null) {
        sessionToken = access;
        userId = String(u.id);
        userName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
        inspectionRole = resolveInspectionRoleFromPlatformUser({ type: u.type ?? null });
      }
    }
  } catch {
    // fall through to direct identity verification below
  }

  // Fallback: the token is not a single-use SSO token (e.g. a raw Sanctum
  // token) — verify identity directly and use the given token as the session.
  if (!sessionToken) {
    const user = await verifyDasmUserToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "توكن غير صالح" },
        { status: 401 }
      );
    }
    sessionToken = token;
    userId = String(user.id);
    userName = user.name || "";
    inspectionRole = user.inspectionRole ?? null;
  }

  const redirectUrl = new URL("/requests", request.url);
  redirectUrl.searchParams.set("gateway", "dasm");
  redirectUrl.searchParams.set("dasm_user_id", userId);
  redirectUrl.searchParams.set("user_name", userName);
  if (returnUrl) redirectUrl.searchParams.set("return_url", returnUrl);

  const res = NextResponse.redirect(redirectUrl);
  // Session cookie the (main) layout gate reads (mirrors manual login) …
  setInspectionSessionCookies(res, sessionToken);
  // … plus the existing identity cookies (user-id/role) for server actions.
  setInspectionGatewayCookies(res, userId, inspectionRole);
  return res;
}

/**
 * POST — إنشاء طلب فحص من DASM عبر API
 *
 * Headers: X-Dasm-Api-Key + Authorization: Bearer {user_token}
 * Body: { dasm_car_id, vehicle_label, title?, auction_reference? }
 */
export async function POST(request: NextRequest) {
  const rl = consumeInspectionCreateRateLimit(request);
  if (!rl.ok) {
    return inspectionCreateRateLimitResponse("gateway", rl.retryAfterSec);
  }

  if (!verifyGatewayApiKey(request)) {
    return NextResponse.json(
      { success: false, message: "مفتاح API غير صالح" },
      { status: 403 }
    );
  }

  const userToken = getBearerToken(request);
  if (!userToken) {
    return NextResponse.json(
      { success: false, message: "Authorization Bearer مطلوب" },
      { status: 401 }
    );
  }

  const user = await verifyDasmUserToken(userToken);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "توكن المستخدم غير صالح" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { dasm_car_id, vehicle_label, title, auction_reference } = body;

    const result = await insertInspectionRequestSubmitted(
      {
        dasm_car_id: String(dasm_car_id ?? ""),
        vehicle_label: String(vehicle_label ?? ""),
        title: title != null ? String(title) : undefined,
        auction_reference:
          auction_reference != null ? String(auction_reference) : undefined,
      },
      user,
      request.nextUrl.origin
    );

    if (!result.ok) {
      const status =
        result.code === "validation_error"
          ? 400
          : result.code === "database_error"
            ? 500
            : 500;
      return NextResponse.json(
        { success: false, message: result.message },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.row.id,
        title: result.row.title,
        status: result.row.status,
        vehicle_label: result.row.vehicle_label,
        tracking_url: result.tracking_url,
      },
      message: "تم إنشاء طلب الفحص بنجاح",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "خطأ في معالجة الطلب" },
      { status: 500 }
    );
  }
}
