import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type {
  VehicleObdScan,
  VehicleObdScanSeverity,
  VehicleObdScanSource,
} from "@/types";

type VehicleObdScanRow = {
  id: string;
  dasm_user_id: string;
  dasm_car_id: string | null;
  vehicle_label: string | null;
  scan_date: string;
  odometer_km: number | null;
  reader_name: string | null;
  protocol: string | null;
  vin: string | null;
  dtc_codes: unknown;
  readiness_monitors: Record<string, unknown> | null;
  live_data: Record<string, unknown> | null;
  battery_voltage: number | string | null;
  summary: string | null;
  severity: VehicleObdScanSeverity;
  source: VehicleObdScanSource;
  created_at: string;
  updated_at: string;
};

function parseDtcCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim().toUpperCase())
    .filter(Boolean);
}

function mapVehicleObdScan(row: VehicleObdScanRow): VehicleObdScan {
  return {
    id: row.id,
    dasmUserId: row.dasm_user_id,
    dasmCarId: row.dasm_car_id ?? undefined,
    vehicleLabel: row.vehicle_label ?? undefined,
    scanDate: row.scan_date,
    odometerKm: row.odometer_km ?? undefined,
    readerName: row.reader_name ?? undefined,
    protocol: row.protocol ?? undefined,
    vin: row.vin ?? undefined,
    dtcCodes: parseDtcCodes(row.dtc_codes),
    readinessMonitors: row.readiness_monitors ?? {},
    liveData: row.live_data ?? {},
    batteryVoltage:
      row.battery_voltage == null ? undefined : Number(row.battery_voltage),
    summary: row.summary ?? undefined,
    severity: row.severity,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listVehicleObdScansForUser(
  dasmUserId: string
): Promise<VehicleObdScan[]> {
  const key = dasmUserId.trim();
  if (!key) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_vehicle_obd_scans")
    .select("*")
    .eq("dasm_user_id", key)
    .order("scan_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return (data as VehicleObdScanRow[]).map(mapVehicleObdScan);
}
