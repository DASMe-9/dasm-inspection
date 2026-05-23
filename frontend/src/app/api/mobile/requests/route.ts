import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMobileRequest,
  listMobileRequestsForAuth,
} from "@/lib/api/mobile-inspection-http";

/**
 * GET /api/mobile/requests
 *
 * قائمة طلبات الفحص حسب دور المستخدم (Sanctum Bearer من منصّة داسم).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const payload = await listMobileRequestsForAuth(auth.normalized);
  return NextResponse.json({
    ...payload,
    role: auth.normalized.inspectionRole,
    user_id: auth.normalized.userId,
  });
}
