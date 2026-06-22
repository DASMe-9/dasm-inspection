import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { listMobileVehicleHistory } from "@/lib/api/mobile-vehicle-history";

/** GET /api/mobile/vehicle-history */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const payload = await listMobileVehicleHistory(auth.normalized.userId);
  return NextResponse.json({
    ...payload,
    user_id: auth.normalized.userId,
  });
}
