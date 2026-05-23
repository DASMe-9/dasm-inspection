import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { mobileConfirmOnSite } from "@/lib/api/mobile-inspection-mutations";

/**
 * POST /api/mobile/requests/:id/on-site
 * Body: { lat?: number, lng?: number }
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

  let body: { lat?: number; lng?: number } = {};
  try {
    body = (await request.json()) as { lat?: number; lng?: number };
  } catch {
    body = {};
  }

  const result = await mobileConfirmOnSite(id, auth.normalized, {
    lat: typeof body.lat === "number" ? body.lat : null,
    lng: typeof body.lng === "number" ? body.lng : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "bad_request", message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
