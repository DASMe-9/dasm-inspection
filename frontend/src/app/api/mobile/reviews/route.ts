import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMobileRequest,
  listMobileReviewsForAuth,
} from "@/lib/api/mobile-inspection-http";

/**
 * GET /api/mobile/reviews — تقييمات ورشة المالك/المدير
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const result = await listMobileReviewsForAuth(auth.normalized);
  if (!result.ok) {
    return NextResponse.json(
      { error: "forbidden", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ reviews: result.reviews });
}
