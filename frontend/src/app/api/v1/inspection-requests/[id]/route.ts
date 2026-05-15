import { NextRequest, NextResponse } from "next/server";
import {
  verifyGatewayApiKey,
  getBearerToken,
  verifyDasmUserToken,
} from "@/lib/api/inspection-http-auth";
import { fetchInspectionRequestOwnedByDasmUser } from "@/lib/api/inspection-request-http";

/**
 * GET /api/v1/inspection-requests/:id
 *
 * يعيد الطلب إذا كان المستخدم المصادَق عليه عبر Bearer هو مالك `dasm_user_id`.
 *
 * @see docs/api-contract.md §3.2
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { id } = params;
  if (!id?.trim()) {
    return NextResponse.json(
      { error: "bad_request", message: "معرّف الطلب مطلوب" },
      { status: 400 }
    );
  }

  const row = await fetchInspectionRequestOwnedByDasmUser(id.trim(), user.id);
  if (!row) {
    return NextResponse.json(
      { error: "not_found", message: "الطلب غير موجود أو غير مصرّح بعرضه" },
      { status: 404 }
    );
  }

  return NextResponse.json(row);
}
