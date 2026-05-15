import { NextRequest, NextResponse } from "next/server";
import {
  verifyGatewayApiKey,
  getBearerToken,
  verifyDasmUserToken,
} from "@/lib/api/inspection-http-auth";
import { insertInspectionRequestSubmitted } from "@/lib/api/inspection-request-http";

/**
 * POST /api/v1/inspection-requests
 *
 * Headers: X-Dasm-Api-Key (أو Authorization: ApiKey …) + Authorization: Bearer مع توكن مستخدم المنصّة
 * Body: { dasm_car_id, vehicle_label, title?, auction_reference? }
 *
 * ملاحظة: هوية صاحب الطلب تُؤخذ من توكن المنصّة (ملف المستخدم)؛ الحقل dasm_user_id في الجسم يُتجاهل
 * لتفادي الانتحال ما لم يُضف لاحقاً تحقق صريح من تطابق المنصّة.
 *
 * @see docs/api-contract.md §3.1
 */
export async function POST(request: NextRequest) {
  if (!verifyGatewayApiKey(request)) {
    return NextResponse.json(
      { error: "forbidden", message: "مفتاح API غير صالح" },
      { status: 403 }
    );
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authorization Bearer مطلوب" },
      { status: 401 }
    );
  }

  const user = await verifyDasmUserToken(token);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "توكن المستخدم غير صالح" },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "JSON غير صالح" },
      { status: 400 }
    );
  }

  const result = await insertInspectionRequestSubmitted(
    {
      dasm_car_id: String(body.dasm_car_id ?? ""),
      vehicle_label: String(body.vehicle_label ?? ""),
      title: body.title != null ? String(body.title) : undefined,
      auction_reference:
        body.auction_reference != null ? String(body.auction_reference) : undefined,
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
      { error: result.code, message: result.message },
      { status }
    );
  }

  return NextResponse.json(
    {
      id: result.row.id,
      status: result.row.status,
      title: result.row.title,
      vehicle_label: result.row.vehicle_label,
      tracking_url: result.tracking_url,
    },
    { status: 201 }
  );
}
