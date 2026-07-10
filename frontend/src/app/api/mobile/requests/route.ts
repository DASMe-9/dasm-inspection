import { NextRequest, NextResponse } from "next/server";
import {
  authenticateMobileRequest,
  listMobileRequestsForAuth,
} from "@/lib/api/mobile-inspection-http";
import { createMobileInspectionRequest } from "@/lib/api/mobile-create-request";
import type { InspectionServiceMode } from "@/types";

/**
 * GET /api/mobile/requests
 *
 * قائمة طلبات الفحص حسب دور المستخدم (Sanctum Bearer من منصّة داسم).
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const payload = await listMobileRequestsForAuth(auth.normalized);
  return NextResponse.json({
    ...payload,
    role: auth.normalized.inspectionRole,
    user_id: auth.normalized.userId,
  });
}

/**
 * POST /api/mobile/requests
 *
 * إنشاء طلب فحص من تطبيق الجوال (عميل dasm_user فقط).
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const role = auth.normalized.inspectionRole;
  if (role !== "dasm_user") {
    return NextResponse.json(
      {
        error: "forbidden",
        message: "إنشاء الطلب متاح لحساب مستخدم داسم (الزبون) فقط",
      },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "جسم الطلب غير صالح" },
      { status: 400 }
    );
  }

  const serviceModeRaw = String(body.service_mode ?? "workshop").trim();
  const serviceMode: InspectionServiceMode =
    serviceModeRaw === "field" ? "field" : "workshop";

  const result = await createMobileInspectionRequest({
    userId: auth.normalized.userId,
    title: String(body.title ?? "").trim() || "طلب فحص",
    vehicleLabel: String(body.vehicle_label ?? "").trim(),
    serviceMode,
    preferredWorkshopId:
      body.preferred_workshop_id != null
        ? String(body.preferred_workshop_id)
        : null,
    preferredSlotAt:
      body.preferred_slot_at != null ? String(body.preferred_slot_at) : null,
    fieldServiceAddress:
      body.field_service_address != null
        ? String(body.field_service_address)
        : null,
    auctionReference:
      body.auction_reference != null ? String(body.auction_reference) : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "create_failed", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { ok: true, request_id: result.requestId },
    { status: 201 }
  );
}
