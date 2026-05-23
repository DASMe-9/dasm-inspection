import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { mobileRejectReport } from "@/lib/api/mobile-inspection-mutations";

/**
 * POST /api/mobile/requests/:id/reject
 * Body: { reason: string }
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
      { error: "bad_request", message: "معرّف الطلب مطلوب" },
      { status: 400 }
    );
  }

  let reason = "";
  try {
    const body = (await request.json()) as { reason?: string };
    reason = String(body.reason ?? "").trim();
  } catch {
    reason = "";
  }

  const result = await mobileRejectReport(id, reason, auth.normalized);
  if (!result.ok) {
    return NextResponse.json(
      { error: "forbidden", message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
