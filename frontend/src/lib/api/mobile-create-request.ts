import { requireAdminClient } from "@/lib/supabase/admin";
import { ensureDasmCarOnCore } from "@/lib/core/ensure-dasm-car-on-core";
import type { InspectionServiceMode } from "@/types";

export type MobileCreateRequestInput = {
  userId: string;
  title: string;
  vehicleLabel: string;
  serviceMode?: InspectionServiceMode;
  preferredWorkshopId?: string | null;
  preferredSlotAt?: string | null;
  fieldServiceAddress?: string | null;
  auctionReference?: string | null;
};

export type MobileCreateRequestResult =
  | { ok: true; requestId: string }
  | { ok: false; status: number; message: string };

/**
 * Customer create-request for the mobile API (Bearer Sanctum).
 * Mirrors createInspectionRequestAction without FormData / Next revalidate.
 */
export async function createMobileInspectionRequest(
  input: MobileCreateRequestInput
): Promise<MobileCreateRequestResult> {
  const title = input.title.trim();
  const vehicleLabel = input.vehicleLabel.trim();
  const userId = input.userId.trim();
  if (!title || !vehicleLabel) {
    return {
      ok: false,
      status: 422,
      message: "عنوان الطلب ووصف المركبة مطلوبان.",
    };
  }
  if (!userId) {
    return { ok: false, status: 401, message: "معرّف المستخدم مطلوب" };
  }

  const serviceMode: InspectionServiceMode =
    input.serviceMode === "field" ? "field" : "workshop";
  const preferredWorkshopId = input.preferredWorkshopId?.trim() || null;
  const fieldAddress = input.fieldServiceAddress?.trim() || null;
  if (serviceMode === "field" && !fieldAddress) {
    return {
      ok: false,
      status: 422,
      message: "عنوان الفحص الميداني مطلوب عند اختيار الخدمة الميدانية.",
    };
  }

  let preferredSlotAt: string | null = null;
  if (input.preferredSlotAt?.trim()) {
    const parsed = new Date(input.preferredSlotAt.trim());
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, status: 422, message: "موعد التفضيل غير صالح." };
    }
    preferredSlotAt = parsed.toISOString();
  }

  const sb = requireAdminClient();

  if (preferredWorkshopId) {
    const { data: preferredWorkshop, error: preferredWorkshopErr } = await sb
      .from("inspection_workshops")
      .select("id, is_verified, is_suspended")
      .eq("id", preferredWorkshopId)
      .maybeSingle();
    if (
      preferredWorkshopErr ||
      !preferredWorkshop ||
      preferredWorkshop.is_verified !== true ||
      preferredWorkshop.is_suspended === true
    ) {
      return {
        ok: false,
        status: 422,
        message: "الورشة المفضّلة غير متاحة أو غير معتمدة.",
      };
    }
  }

  const { data, error } = await sb
    .from("inspection_requests")
    .insert({
      title,
      dasm_car_id: "pending",
      vehicle_label: vehicleLabel,
      dasm_user_id: userId,
      auction_reference: input.auctionReference?.trim() || null,
      status: "submitted",
      service_mode: serviceMode,
      preferred_workshop_id: preferredWorkshopId,
      preferred_slot_at: preferredSlotAt,
      field_service_address: serviceMode === "field" ? fieldAddress : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      status: 500,
      message: error?.message ?? "فشل إنشاء الطلب",
    };
  }

  const numericUserId = Number.parseInt(userId, 10);
  if (Number.isFinite(numericUserId) && numericUserId > 0) {
    const carId = await ensureDasmCarOnCore({
      userId: numericUserId,
      vehicleLabel,
      inspectionRequestId: data.id,
      title,
    });
    if (carId) {
      await sb
        .from("inspection_requests")
        .update({ dasm_car_id: String(carId) })
        .eq("id", data.id);
    }
  }

  const preferenceParts: string[] = [
    `نوع الخدمة المفضّل: ${serviceMode === "field" ? "ميداني" : "في الورشة"}`,
    "المصدر: تطبيق الجوال",
  ];
  if (preferredWorkshopId) {
    preferenceParts.push(`ورشة مفضّلة (تفضيل عميل): ${preferredWorkshopId}`);
  }

  await sb.from("inspection_status_history").insert({
    request_id: data.id,
    status: "submitted",
    note: preferenceParts.join(" — "),
    actor_role: "dasm_user",
  });

  return { ok: true, requestId: data.id as string };
}
