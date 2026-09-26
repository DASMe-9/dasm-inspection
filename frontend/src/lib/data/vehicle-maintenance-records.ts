import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type {
  VehicleMaintenanceRecord,
  VehicleMaintenanceRecordSource,
  VehicleMaintenanceServiceType,
} from "@/types";

type VehicleMaintenanceRecordRow = {
  id: string;
  dasm_user_id: string;
  dasm_car_id: string | null;
  vehicle_label: string | null;
  service_type: VehicleMaintenanceServiceType;
  service_date: string;
  odometer_km: number | null;
  next_due_date: string | null;
  next_due_odometer_km: number | null;
  provider_name: string | null;
  notes: string | null;
  source: VehicleMaintenanceRecordSource;
  created_at: string;
  updated_at: string;
};

function mapMaintenanceRecord(
  row: VehicleMaintenanceRecordRow
): VehicleMaintenanceRecord {
  return {
    id: row.id,
    dasmUserId: row.dasm_user_id,
    dasmCarId: row.dasm_car_id ?? undefined,
    vehicleLabel: row.vehicle_label ?? undefined,
    serviceType: row.service_type,
    serviceDate: row.service_date,
    odometerKm: row.odometer_km ?? undefined,
    nextDueDate: row.next_due_date ?? undefined,
    nextDueOdometerKm: row.next_due_odometer_km ?? undefined,
    providerName: row.provider_name ?? undefined,
    notes: row.notes ?? undefined,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export async function listVehicleMaintenanceRecordsForUser(
  dasmUserId: string
): Promise<VehicleMaintenanceRecord[]> {
  const key = dasmUserId.trim();
  if (!key) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_vehicle_maintenance_records")
    .select("*")
    .eq("dasm_user_id", key)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return (data as VehicleMaintenanceRecordRow[]).map(mapMaintenanceRecord);
}

/**
 * Permanent technical history for a Core vehicle across successive owners.
 * Callers must first prove that the signed-in user currently owns the car via
 * Core `/api/me/garage`; this function intentionally does not expose raw files.
 */
export async function listVehicleMaintenanceRecordsForCar(
  dasmCarId: string
): Promise<VehicleMaintenanceRecord[]> {
  const key = dasmCarId.trim();
  if (!key) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_vehicle_maintenance_records")
    .select("*")
    .eq("dasm_car_id", key)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];
  return (data as VehicleMaintenanceRecordRow[]).map(mapMaintenanceRecord);
}
