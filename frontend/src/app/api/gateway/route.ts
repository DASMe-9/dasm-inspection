/**
 * بوابة الفحص من DASM Platform
 *
 * GET /api/gateway?token=xxx → يوجه المستخدم لصفحة طلب الفحص
 * POST /api/gateway → ينشئ طلب فحص عبر API key
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

const VALID_API_KEYS = (process.env.DASM_GATEWAY_API_KEYS || "")
  .split(",")
  .filter(Boolean);

const DASM_API_URL = process.env.DASM_API_URL || "https://api.dasm.com.sa";

function verifyApiKey(request: NextRequest): boolean {
  const apiKey =
    request.headers.get("X-Dasm-Api-Key") ||
    request.headers.get("Authorization")?.replace("ApiKey ", "");
  if (!apiKey) return false;
  return VALID_API_KEYS.includes(apiKey);
}

async function verifyDasmToken(token: string) {
  try {
    const res = await fetch(`${DASM_API_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || data;
  } catch {
    return null;
  }
}

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

  const user = await verifyDasmToken(token);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "توكن غير صالح" },
      { status: 401 }
    );
  }

  // توجيه لصفحة الطلبات مع بيانات المستخدم
  const redirectUrl = new URL("/requests", request.url);
  redirectUrl.searchParams.set("gateway", "dasm");
  redirectUrl.searchParams.set("dasm_user_id", String(user.id));
  redirectUrl.searchParams.set("user_name", user.name || "");
  if (returnUrl) redirectUrl.searchParams.set("return_url", returnUrl);

  return NextResponse.redirect(redirectUrl);
}

/**
 * POST — إنشاء طلب فحص من DASM عبر API
 *
 * Headers: X-Dasm-Api-Key + Authorization: Bearer {user_token}
 * Body: { dasm_car_id, vehicle_label, title?, auction_reference? }
 */
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json(
      { success: false, message: "مفتاح API غير صالح" },
      { status: 403 }
    );
  }

  const userToken = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");
  if (!userToken) {
    return NextResponse.json(
      { success: false, message: "Authorization header مطلوب" },
      { status: 401 }
    );
  }

  const user = await verifyDasmToken(userToken);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "توكن المستخدم غير صالح" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { dasm_car_id, vehicle_label, title, auction_reference } = body;

    if (!dasm_car_id || !vehicle_label) {
      return NextResponse.json(
        {
          success: false,
          message: "dasm_car_id و vehicle_label مطلوبان",
        },
        { status: 400 }
      );
    }

    const sb = getAdminClient();
    if (!sb) {
      return NextResponse.json(
        { success: false, message: "خطأ في الاتصال بقاعدة البيانات" },
        { status: 500 }
      );
    }

    const { data, error } = await sb
      .from("inspection_requests")
      .insert({
        title: title || `فحص ${vehicle_label}`,
        dasm_car_id,
        vehicle_label,
        dasm_user_id: String(user.id),
        auction_reference: auction_reference || null,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // إضافة سجل الحالة
    await sb.from("inspection_status_history").insert({
      request_id: data.id,
      status: "submitted",
      note: `طلب فحص من منصة داسم — ${user.name}`,
      actor_role: "dasm_user",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        status: data.status,
        vehicle_label: data.vehicle_label,
        tracking_url: `${request.nextUrl.origin}/requests/${data.id}`,
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
