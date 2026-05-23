import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { mobileUpdateChecklistItem } from "@/lib/api/mobile-inspection-mutations";
import type { ReportItemStatus } from "@/types";

/** PATCH /api/mobile/checklist-items/:itemId */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const itemId = params.itemId?.trim();
  if (!itemId) {
    return NextResponse.json(
      { error: "bad_request", message: "معرّف البند مطلوب" },
      { status: 400 }
    );
  }

  let body: { status?: string; notes?: string | null } = {};
  try {
    body = (await request.json()) as { status?: string; notes?: string | null };
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "JSON غير صالح" },
      { status: 400 }
    );
  }

  const status = body.status as ReportItemStatus | undefined;
  if (!status) {
    return NextResponse.json(
      { error: "bad_request", message: "حالة البند مطلوبة" },
      { status: 400 }
    );
  }

  const result = await mobileUpdateChecklistItem(
    itemId,
    status,
    body.notes ?? undefined,
    auth.normalized
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: "bad_request", message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
