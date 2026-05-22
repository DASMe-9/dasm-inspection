import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import { mapInspector } from "@/lib/data/mappers";
import {
  getPlatformDefaultPricing,
  getWorkshopPricing,
} from "@/lib/data/inspection-pricing-data";
import { getInspectorsForWorkshop } from "@/lib/data/inspection";
import type { Inspector } from "@/types";
import type {
  WorkshopPricingOverride,
  WorkshopServiceArea,
} from "@/types/workshop-management";

function mapArea(row: {
  id: string;
  workshop_id: string;
  city: string;
  district: string | null;
  supports_workshop: boolean;
  supports_field: boolean;
  is_primary: boolean;
}): WorkshopServiceArea {
  return {
    id: row.id,
    workshopId: row.workshop_id,
    city: row.city,
    district: row.district ?? undefined,
    supportsWorkshop: row.supports_workshop,
    supportsField: row.supports_field,
    isPrimary: row.is_primary,
  };
}

export async function listWorkshopTeam(
  workshopId: string
): Promise<Inspector[]> {
  return getInspectorsForWorkshop(workshopId);
}

export async function listAllWorkshopInspectors(
  workshopId: string
): Promise<Inspector[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_inspectors")
    .select("*")
    .eq("workshop_id", workshopId)
    .order("full_name");
  if (error || !data) return [];
  return data.map((r) => mapInspector(r as Parameters<typeof mapInspector>[0]));
}

export async function getWorkshopPricingForManage(
  workshopId: string
): Promise<WorkshopPricingOverride> {
  const [workshop, platform] = await Promise.all([
    getWorkshopPricing(workshopId),
    getPlatformDefaultPricing(),
  ]);
  return {
    workshopSar: workshop?.workshopSar ?? null,
    fieldSar: workshop?.fieldSar ?? null,
    currency: workshop?.currency ?? platform?.currency ?? "SAR",
    platformWorkshopSar: platform?.workshopSar ?? null,
    platformFieldSar: platform?.fieldSar ?? null,
  };
}

export async function listWorkshopServiceAreas(
  workshopId: string
): Promise<WorkshopServiceArea[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_workshop_service_areas")
    .select("*")
    .eq("workshop_id", workshopId)
    .order("is_primary", { ascending: false })
    .order("city");
  if (error || !data) return [];
  return data.map((r) => mapArea(r as Parameters<typeof mapArea>[0]));
}
