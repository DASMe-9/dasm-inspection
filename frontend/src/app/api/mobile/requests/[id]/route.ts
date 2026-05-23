import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMobileRequest,
  getMobileRequestDetail,
} from "@/lib/api/mobile-inspection-http";

/**
 * GET /api/mobile/requests/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { error: "bad_request", message: "معرّف الطلب مطلوب" },
      { status: 400 }
    );
  }

  const detail = await getMobileRequestDetail(id, auth.normalized);
  if (!detail.ok) {
    return NextResponse.json(
      { error: "forbidden", message: detail.message },
      { status: detail.status }
    );
  }

  return NextResponse.json(detail);
}
