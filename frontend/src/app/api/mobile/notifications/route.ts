import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMobileRequest,
  listMobileNotificationsForAuth,
} from "@/lib/api/mobile-inspection-http";

/**
 * GET /api/mobile/notifications
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const payload = await listMobileNotificationsForAuth({
    userId: auth.normalized.userId,
  });
  return NextResponse.json(payload);
}
