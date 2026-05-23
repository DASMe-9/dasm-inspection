import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMobileRequest,
  markMobileNotificationRead,
} from "@/lib/api/mobile-inspection-http";

/**
 * POST /api/mobile/notifications/:id/read
 */
export async function POST(
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
      { error: "bad_request", message: "معرّف الإشعار مطلوب" },
      { status: 400 }
    );
  }

  const result = await markMobileNotificationRead(id, auth.normalized.userId);
  if (!result.ok) {
    return NextResponse.json(
      { error: "not_found", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true });
}
