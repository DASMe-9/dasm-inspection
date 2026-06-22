"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { requireAdminClient } from "@/lib/supabase/admin";
import type { VehicleObdScanSeverity } from "@/types";

export type VehicleObdScanResult =
  | { ok: true }
  | { ok: false; message: string };

const OBD_CODE_RE = /^[PCBU][0-9A-F]{4}$/i;
const SEVERITIES = new Set<VehicleObdScanSeverity>([
  "clear",
  "info",
  "warning",
  "critical",
  "unknown",
]);

function normalizeDateTime(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  if (!value) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`).toISOString();
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
}

function parsePositiveInt(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim().replace(/,/g, "");
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseBatteryVoltage(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim().replace(",", ".");
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : null;
}

function parseDtcCodes(raw: FormDataEntryValue | null): string[] | null {
  const value = String(raw ?? "").trim();
  if (!value) return [];

  const tokens = value
    .split(/[\s,،;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);

  const invalid = tokens.filter((token) => !OBD_CODE_RE.test(token));
  if (invalid.length > 0) return null;

  return Array.from(new Set(tokens));
}

function buildMaintenanceNote({
  codes,
  summary,
}: {
  codes: string[];
  summary: string | null;
}): string {
  const codesText =
    codes.length > 0 ? `OBD: ${codes.join(", ")}` : "OBD: لا توجد أكواد أعطال";
  return summary ? `${codesText} - ${summary}` : codesText;
}

export async function createVehicleObdScanAction(
  formData: FormData
): Promise<VehicleObdScanResult> {
  const dasmUserId =
    cookies().get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? "";
  if (!dasmUserId) {
    return {
      ok: false,
      message: "افتح الصفحة من بوابة داسم أولًا حتى نربط فحص الكمبيوتر بحسابك.",
    };
  }

  const dtcCodes = parseDtcCodes(formData.get("dtc_codes"));
  if (!dtcCodes) {
    return {
      ok: false,
      message: "أدخل أكواد OBD بصيغة مثل P0300 أو C1234، أو اترك الحقل فارغًا.",
    };
  }

  const severity = String(
    formData.get("severity") ?? "unknown"
  ).trim() as VehicleObdScanSeverity;
  if (!SEVERITIES.has(severity)) {
    return { ok: false, message: "اختر مستوى نتيجة فحص صالح." };
  }

  const scanDate = normalizeDateTime(formData.get("scan_date"));
  const dasmCarId = String(formData.get("dasm_car_id") ?? "").trim() || null;
  const vehicleLabel =
    String(formData.get("vehicle_label") ?? "").trim() || null;
  const readerName = String(formData.get("reader_name") ?? "").trim() || null;
  const protocol = String(formData.get("protocol") ?? "").trim() || null;
  const vin = String(formData.get("vin") ?? "").trim().toUpperCase() || null;
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const odometerKm = parsePositiveInt(formData.get("odometer_km"));
  const batteryVoltage = parseBatteryVoltage(formData.get("battery_voltage"));

  try {
    const sb = requireAdminClient();
    const { error } = await sb.from("inspection_vehicle_obd_scans").insert({
      dasm_user_id: dasmUserId,
      dasm_car_id: dasmCarId,
      vehicle_label: vehicleLabel,
      scan_date: scanDate,
      odometer_km: odometerKm,
      reader_name: readerName,
      protocol,
      vin,
      dtc_codes: dtcCodes,
      readiness_monitors: {},
      live_data: {},
      battery_voltage: batteryVoltage,
      summary,
      severity,
      source: "user_entry",
    });

    if (error) return { ok: false, message: error.message };

    const serviceDate = scanDate.slice(0, 10);
    const { error: maintenanceError } = await sb
      .from("inspection_vehicle_maintenance_records")
      .insert({
        dasm_user_id: dasmUserId,
        dasm_car_id: dasmCarId,
        vehicle_label: vehicleLabel,
        service_type: "obd_scan",
        service_date: serviceDate,
        odometer_km: odometerKm,
        provider_name: readerName,
        notes: buildMaintenanceNote({ codes: dtcCodes, summary }),
        source: "user_entry",
      });

    if (maintenanceError) {
      inspectionOpsLog("warn", "obd_scan_maintenance_link_failed", {
        dasm_user_id: dasmUserId,
        message: maintenanceError.message,
      });
    }

    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "تعذّر حفظ فحص كمبيوتر السيارة.";
    inspectionOpsLog("error", "vehicle_obd_scan_create_exception", {
      dasm_user_id: dasmUserId,
      message,
    });
    return { ok: false, message };
  }
}
