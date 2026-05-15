/**
 * بوابة الفحص من DASM Platform
 *
 * GET /api/gateway?token=xxx → يوجه المستخدم لصفحة طلب الفحص
 * POST /api/gateway → ينشئ طلب فحص عبر API key (يُفضّل للمنصّات الجديدة استخدام POST /api/v1/inspection-requests)
 */

import { NextRequest, NextResponse } from "next/server";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import {
  verifyGatewayApiKey,
  getBearerToken,
  verifyDasmUserToken,
} from "@/lib/api/inspection-http-auth";
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

  const user = await verifyDasmUserToken(token);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "توكن غير صالح" },
      { status: 401 }
    );
  }

  const redirectUrl = new URL("/requests", request.url);
  redirectUrl.searchParams.set("gateway", "dasm");
  redirectUrl.searchParams.set("dasm_user_id", String(user.id));
  redirectUrl.searchParams.set("user_name", user.name || "");
  if (returnUrl) redirectUrl.searchParams.set("return_url", returnUrl);

  const res = NextResponse.redirect(redirectUrl);
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({
    name: INSPECTION_DASM_USER_COOKIE,
    value: String(user.id),
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
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
