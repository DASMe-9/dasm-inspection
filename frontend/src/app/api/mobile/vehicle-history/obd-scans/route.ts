import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { createMobileObdScan } from "@/lib/api/mobile-vehicle-history";

/** POST /api/mobile/vehicle-history/obd-scans */
export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "JSON غير صالح" },
      { status: 400 }
    );
  }

  const result = await createMobileObdScan(auth.normalized.userId, body);
  if (!result.ok) {
    return NextResponse.json(
      { error: "bad_request", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true });
}
