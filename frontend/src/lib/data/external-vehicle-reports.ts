import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { ExternalReportOcrStatus, ExternalVehicleReport } from "@/types";

type ExternalVehicleReportRow = {
  id: string;
  dasm_user_id: string;
  dasm_car_id: string | null;
  vehicle_label: string | null;
  report_source: string | null;
  report_date: string | null;
  file_name: string;
  mime_type: string;
  ocr_status: ExternalReportOcrStatus;
  extracted_summary: Record<string, unknown> | null;
  maintenance_reminders: unknown[] | null;
  created_at: string;
  updated_at: string;
};

function mapExternalVehicleReport(
  row: ExternalVehicleReportRow
): ExternalVehicleReport {
  return {
    id: row.id,
    dasmUserId: row.dasm_user_id,
    dasmCarId: row.dasm_car_id ?? undefined,
    vehicleLabel: row.vehicle_label ?? undefined,
    reportSource: row.report_source ?? undefined,
    reportDate: row.report_date ?? undefined,
    fileName: row.file_name,
    mimeType: row.mime_type,
    ocrStatus: row.ocr_status,
    extractedSummary: row.extracted_summary ?? {},
    maintenanceReminders: row.maintenance_reminders ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export async function listExternalVehicleReportsForUser(
  dasmUserId: string
): Promise<ExternalVehicleReport[]> {
  const key = dasmUserId.trim();
  if (!key) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_external_vehicle_reports")
    .select("*")
    .eq("dasm_user_id", key)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return (data as ExternalVehicleReportRow[]).map(mapExternalVehicleReport);
}
