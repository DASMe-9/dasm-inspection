import "server-only";

import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { listExternalVehicleReportsForUser } from "@/lib/data/external-vehicle-reports";
import { listVehicleMaintenanceRecordsForUser } from "@/lib/data/vehicle-maintenance-records";
import { listVehicleObdScansForUser } from "@/lib/data/vehicle-obd-scans";
import { requireAdminClient } from "@/lib/supabase/admin";
import type {
  ExternalVehicleReport,
  VehicleMaintenanceRecord,
  VehicleMaintenanceServiceType,
  VehicleObdScan,
  VehicleObdScanSeverity,
} from "@/types";

export type MobileVehicleHistoryResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

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

const OBD_CODE_RE = /^[PCBU][0-9A-F]{4}$/i;
const OBD_SEVERITIES = new Set<VehicleObdScanSeverity>([
  "clear",
  "info",
  "warning",
  "critical",
  "unknown",
]);

const MAX_REPORT_BYTES = 15 * 1024 * 1024;
const ALLOWED_REPORT_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function optionalString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeDate(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeDateTime(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T12:00:00.000Z`).toISOString();
  }
  const parsed = new Date(text);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : new Date().toISOString();
}

function parsePositiveInt(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/,/g, "");
  if (!text) return null;
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseBatteryVoltage(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;
  const n = Number.parseFloat(text);
  return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : null;
}

function parseDtcCodes(value: unknown): string[] | null {
  const text = String(value ?? "").trim();
  if (!text) return [];
  const tokens = text
    .split(/[\s,،;]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);
  if (tokens.some((token) => !OBD_CODE_RE.test(token))) return null;
  return Array.from(new Set(tokens));
}

function safeFileSegment(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, "_");
  return (base || "external-report").slice(0, 160);
}

function toMobileMaintenance(row: VehicleMaintenanceRecord) {
  return {
    id: row.id,
    dasm_car_id: row.dasmCarId ?? null,
    vehicle_label: row.vehicleLabel ?? null,
    service_type: row.serviceType,
    service_date: row.serviceDate,
    odometer_km: row.odometerKm ?? null,
    next_due_date: row.nextDueDate ?? null,
    next_due_odometer_km: row.nextDueOdometerKm ?? null,
    provider_name: row.providerName ?? null,
    notes: row.notes ?? null,
    source: row.source,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function toMobileExternalReport(row: ExternalVehicleReport) {
  return {
    id: row.id,
    dasm_car_id: row.dasmCarId ?? null,
    vehicle_label: row.vehicleLabel ?? null,
    report_source: row.reportSource ?? null,
    report_date: row.reportDate ?? null,
    file_name: row.fileName,
    mime_type: row.mimeType,
    ocr_status: row.ocrStatus,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function toMobileObdScan(row: VehicleObdScan) {
  return {
    id: row.id,
    dasm_car_id: row.dasmCarId ?? null,
    vehicle_label: row.vehicleLabel ?? null,
    scan_date: row.scanDate,
    odometer_km: row.odometerKm ?? null,
    reader_name: row.readerName ?? null,
    protocol: row.protocol ?? null,
    vin: row.vin ?? null,
    dtc_codes: row.dtcCodes,
    battery_voltage: row.batteryVoltage ?? null,
    summary: row.summary ?? null,
    severity: row.severity,
    source: row.source,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export async function listMobileVehicleHistory(dasmUserId: string) {
  const [maintenance, externalReports, obdScans] = await Promise.all([
    listVehicleMaintenanceRecordsForUser(dasmUserId),
    listExternalVehicleReportsForUser(dasmUserId),
    listVehicleObdScansForUser(dasmUserId),
  ]);

  return {
    maintenance_records: maintenance.map(toMobileMaintenance),
    external_reports: externalReports.map(toMobileExternalReport),
    obd_scans: obdScans.map(toMobileObdScan),
  };
}

export async function createMobileMaintenanceRecord(
  dasmUserId: string,
  body: Record<string, unknown>
): Promise<MobileVehicleHistoryResult> {
  const serviceType = optionalString(body.service_type) as
    | VehicleMaintenanceServiceType
    | null;
  if (!serviceType || !SERVICE_TYPES.has(serviceType)) {
    return { ok: false, status: 422, message: "اختر نوع صيانة صالح." };
  }

  const serviceDate = normalizeDate(body.service_date);
  if (!serviceDate) {
    return { ok: false, status: 422, message: "تاريخ الصيانة مطلوب." };
  }

  const sb = requireAdminClient();
  const { error } = await sb
    .from("inspection_vehicle_maintenance_records")
    .insert({
      dasm_user_id: dasmUserId,
      dasm_car_id: optionalString(body.dasm_car_id),
      vehicle_label: optionalString(body.vehicle_label),
      service_type: serviceType,
      service_date: serviceDate,
      odometer_km: parsePositiveInt(body.odometer_km),
      next_due_date: normalizeDate(body.next_due_date),
      next_due_odometer_km: parsePositiveInt(body.next_due_odometer_km),
      provider_name: optionalString(body.provider_name),
      notes: optionalString(body.notes),
      source: "user_entry",
    });

  if (error) return { ok: false, status: 500, message: error.message };
  return { ok: true };
}

export async function createMobileObdScan(
  dasmUserId: string,
  body: Record<string, unknown>
): Promise<MobileVehicleHistoryResult> {
  const dtcCodes = parseDtcCodes(body.dtc_codes);
  if (!dtcCodes) {
    return {
      ok: false,
      status: 422,
      message: "أدخل أكواد OBD بصيغة مثل P0300 أو اترك الحقل فارغًا.",
    };
  }

  const severity = (optionalString(body.severity) ??
    "unknown") as VehicleObdScanSeverity;
  if (!OBD_SEVERITIES.has(severity)) {
    return { ok: false, status: 422, message: "اختر نتيجة فحص صالحة." };
  }

  const scanDate = normalizeDateTime(body.scan_date);
  const dasmCarId = optionalString(body.dasm_car_id);
  const vehicleLabel = optionalString(body.vehicle_label);
  const readerName = optionalString(body.reader_name);
  const summary = optionalString(body.summary);
  const odometerKm = parsePositiveInt(body.odometer_km);

  const sb = requireAdminClient();
  const { error } = await sb.from("inspection_vehicle_obd_scans").insert({
    dasm_user_id: dasmUserId,
    dasm_car_id: dasmCarId,
    vehicle_label: vehicleLabel,
    scan_date: scanDate,
    odometer_km: odometerKm,
    reader_name: readerName,
    protocol: optionalString(body.protocol),
    vin: optionalString(body.vin)?.toUpperCase() ?? null,
    dtc_codes: dtcCodes,
    readiness_monitors: {},
    live_data: {},
    battery_voltage: parseBatteryVoltage(body.battery_voltage),
    summary,
    severity,
    source: "user_entry",
  });

  if (error) return { ok: false, status: 500, message: error.message };

  const codesText =
    dtcCodes.length > 0 ? `OBD: ${dtcCodes.join(", ")}` : "OBD: لا توجد أكواد أعطال";
  const { error: maintenanceError } = await sb
    .from("inspection_vehicle_maintenance_records")
    .insert({
      dasm_user_id: dasmUserId,
      dasm_car_id: dasmCarId,
      vehicle_label: vehicleLabel,
      service_type: "obd_scan",
      service_date: scanDate.slice(0, 10),
      odometer_km: odometerKm,
      provider_name: readerName,
      notes: summary ? `${codesText} - ${summary}` : codesText,
      source: "user_entry",
    });

  if (maintenanceError) {
    inspectionOpsLog("warn", "mobile_obd_scan_maintenance_link_failed", {
      dasm_user_id: dasmUserId,
      message: maintenanceError.message,
    });
  }

  return { ok: true };
}

export async function uploadMobileExternalReport(
  dasmUserId: string,
  formData: FormData
): Promise<MobileVehicleHistoryResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, status: 422, message: "اختر ملف تقرير صالح." };
  }
  if (file.size > MAX_REPORT_BYTES) {
    return { ok: false, status: 413, message: "الحد الأقصى للملف 15 ميغابايت." };
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_REPORT_MIME.has(mime)) {
    return { ok: false, status: 422, message: "يسمح برفع PDF أو صور فقط." };
  }

  const sb = requireAdminClient();
  const bucket =
    process.env.INSPECTION_ATTACHMENTS_BUCKET?.trim() ||
    "inspection-attachments";
  const storagePath = `external-reports/${dasmUserId}/${Date.now()}-${safeFileSegment(
    file.name
  )}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await sb.storage
    .from(bucket)
    .upload(storagePath, buf, { contentType: mime, upsert: false });

  if (uploadError) {
    return { ok: false, status: 500, message: uploadError.message };
  }

  const { error: insertError } = await sb
    .from("inspection_external_vehicle_reports")
    .insert({
      dasm_user_id: dasmUserId,
      dasm_car_id: optionalString(formData.get("dasm_car_id")),
      vehicle_label: optionalString(formData.get("vehicle_label")),
      report_source: optionalString(formData.get("report_source")),
      report_date: normalizeDate(formData.get("report_date")),
      file_name: file.name.slice(0, 255),
      mime_type: mime,
      storage_path: storagePath,
      ocr_status: "pending",
    });

  if (insertError) {
    await sb.storage.from(bucket).remove([storagePath]);
    return { ok: false, status: 500, message: insertError.message };
  }

  return { ok: true };
}
