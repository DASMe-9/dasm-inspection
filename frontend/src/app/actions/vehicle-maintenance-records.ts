"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { requireAdminClient } from "@/lib/supabase/admin";
import type { VehicleMaintenanceServiceType } from "@/types";

export type MaintenanceRecordResult =
  | { ok: true }
  | { ok: false; message: string };

const SERVICE_TYPES = new Set<VehicleMaintenanceServiceType>([
  "oil_change",
  "oil_filter",
  "air_filter",
  "cabin_filter",
  "fuel_filter",
  "tires",
  "brakes",
  "battery",
  "coolant",
  "transmission",
  "obd_scan",
  "periodic_inspection",
  "other",
]);

function normalizeDate(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function parsePositiveInt(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim().replace(/,/g, "");
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createVehicleMaintenanceRecordAction(
  formData: FormData
): Promise<MaintenanceRecordResult> {
  const dasmUserId =
    cookies().get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? "";
  if (!dasmUserId) {
    return {
      ok: false,
      message: "افتح الصفحة من بوابة داسم أولاً حتى نربط الصيانة بحسابك.",
    };
  }

  const serviceType = String(
    formData.get("service_type") ?? ""
  ).trim() as VehicleMaintenanceServiceType;
  if (!SERVICE_TYPES.has(serviceType)) {
    return { ok: false, message: "اختر نوع صيانة صالح." };
  }

  const serviceDate = normalizeDate(formData.get("service_date"));
  if (!serviceDate) {
    return { ok: false, message: "تاريخ الصيانة مطلوب." };
  }

  const nextDueDate = normalizeDate(formData.get("next_due_date"));
  const odometerKm = parsePositiveInt(formData.get("odometer_km"));
  const nextDueOdometerKm = parsePositiveInt(
    formData.get("next_due_odometer_km")
  );

  try {
    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_vehicle_maintenance_records")
      .insert({
        dasm_user_id: dasmUserId,
        dasm_car_id:
          String(formData.get("dasm_car_id") ?? "").trim() || null,
        vehicle_label:
          String(formData.get("vehicle_label") ?? "").trim() || null,
        service_type: serviceType,
        service_date: serviceDate,
        odometer_km: odometerKm,
        next_due_date: nextDueDate,
        next_due_odometer_km: nextDueOdometerKm,
        provider_name:
          String(formData.get("provider_name") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        source: "user_entry",
      });

    if (error) return { ok: false, message: error.message };

    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حفظ سجل الصيانة.";
    inspectionOpsLog("error", "maintenance_record_create_exception", {
      dasm_user_id: dasmUserId,
      message,
    });
    return { ok: false, message };
  }
}
