import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { mobileStartInspection } from "@/lib/api/mobile-inspection-mutations";

/** POST /api/mobile/requests/:id/start */
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
      { error: "bad_request", message: "معرّف الطلب مطلوب" },
      { status: 400 }
    );
  }

  const result = await mobileStartInspection(id, auth.normalized);
  if (!result.ok) {
    return NextResponse.json(
      { error: "bad_request", message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
