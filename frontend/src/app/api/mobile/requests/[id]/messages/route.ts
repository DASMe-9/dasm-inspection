import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { mobileSendRequestMessage } from "@/lib/api/mobile-inspection-mutations";

/** POST /api/mobile/requests/:id/messages — send a message on the request thread. */
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

  let body = "";
  try {
    const json = (await request.json()) as { body?: unknown };
    body = typeof json.body === "string" ? json.body : "";
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "طلب غير صالح" },
      { status: 400 }
    );
  }

  const result = await mobileSendRequestMessage(id, body, auth.normalized);
  if (!result.ok) {
    return NextResponse.json(
      { error: "bad_request", message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
