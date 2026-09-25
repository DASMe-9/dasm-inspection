import { requireAdminClient } from "@/lib/supabase/admin";
import { ensureDasmCarOnCore } from "@/lib/core/ensure-dasm-car-on-core";
import { verifyOwnedCar } from "@/lib/core/verify-owned-car";
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
  dasmCarId?: number | null;
  platformToken?: string | null;
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
  let vehicleLabel = input.vehicleLabel.trim();
  const userId = input.userId.trim();
  if (!title || (!vehicleLabel && !input.dasmCarId)) {
    return {
      ok: false,
      status: 422,
      message: "عنوان الطلب ووصف المركبة مطلوبان.",
    };
  }
  if (!userId) {
    return { ok: false, status: 401, message: "معرّف المستخدم مطلوب" };
  }

  let selectedCarId: number | null = null;
  if (input.dasmCarId != null) {
    const owned = await verifyOwnedCar(
      input.dasmCarId,
      input.platformToken?.trim() || ""
    );
    if (!owned.ok) {
      return { ok: false, status: owned.status, message: owned.message };
    }
    selectedCarId = owned.carId;
    vehicleLabel = owned.vehicleLabel;
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

  const preferredSlotRaw = input.preferredSlotAt?.trim() || "";
  if (!preferredSlotRaw) {
    return { ok: false, status: 422, message: "اختر تاريخ ووقت الموعد." };
  }
  const parsedSlot = new Date(preferredSlotRaw);
  if (Number.isNaN(parsedSlot.getTime())) {
    return { ok: false, status: 422, message: "موعد الفحص غير صالح." };
  }
  if (parsedSlot.getTime() <= Date.now()) {
    return { ok: false, status: 422, message: "اختر موعداً مستقبلياً للفحص." };
  }
  const preferredSlotAt = parsedSlot.toISOString();

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
      dasm_car_id: selectedCarId ? String(selectedCarId) : "pending",
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
  if (!selectedCarId && Number.isFinite(numericUserId) && numericUserId > 0) {
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
