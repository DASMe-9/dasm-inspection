import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import {
  buildWorkshopPricingMap,
  type PricingRow,
} from "@/lib/inspection-pricing";
import type { InspectionServiceMode, WorkshopServicePricing } from "@/types";

type DbPricingRow = {
  workshop_id: string | null;
  service_mode: InspectionServiceMode;
  price_sar: number | string;
  currency: string;
};

function mapRow(r: DbPricingRow): PricingRow {
  return {
    workshop_id: r.workshop_id,
    service_mode: r.service_mode,
    price_sar: Number(r.price_sar),
    currency: r.currency || "SAR",
  };
}

export async function listActiveServicePricingRows(): Promise<PricingRow[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_service_pricing")
    .select("workshop_id, service_mode, price_sar, currency")
    .eq("is_active", true)
    .order("workshop_id", { ascending: true, nullsFirst: true });
  if (error || !data) return [];
  return (data as DbPricingRow[]).map(mapRow);
}

export async function getPlatformDefaultPricing(): Promise<WorkshopServicePricing | null> {
  const map = buildWorkshopPricingMap(await listActiveServicePricingRows());
  return map.get(null) ?? null;
}

export async function getWorkshopPricing(
  workshopId: string
): Promise<WorkshopServicePricing | null> {
  const rows = await listActiveServicePricingRows();
  const map = buildWorkshopPricingMap(rows);
  const platform = map.get(null);
  const workshop = map.get(workshopId);
  if (!platform && !workshop) return null;
  return {
    workshopSar: workshop?.workshopSar ?? platform?.workshopSar ?? null,
    fieldSar: workshop?.fieldSar ?? platform?.fieldSar ?? null,
    currency: workshop?.currency ?? platform?.currency ?? "SAR",
  };
}

export async function attachPricingToWorkshopIds(
  workshopIds: string[]
): Promise<Map<string, WorkshopServicePricing>> {
  const map = buildWorkshopPricingMap(await listActiveServicePricingRows());
  const platform = map.get(null);
  const out = new Map<string, WorkshopServicePricing>();

  for (const id of workshopIds) {
    const w = map.get(id);
    out.set(id, {
      workshopSar: w?.workshopSar ?? platform?.workshopSar ?? null,
      fieldSar: w?.fieldSar ?? platform?.fieldSar ?? null,
      currency: w?.currency ?? platform?.currency ?? "SAR",
    });
  }
  return out;
}

export type ServicePricingApiPayload = {
  currency_default: string;
  platform: { workshop_sar: number | null; field_sar: number | null };
  workshops: Array<{
    workshop_id: string;
    workshop_sar: number | null;
    field_sar: number | null;
    currency: string;
  }>;
};

export async function buildServicePricingApiPayload(
  filterWorkshopId?: string
): Promise<ServicePricingApiPayload> {
  const rows = await listActiveServicePricingRows();
  const map = buildWorkshopPricingMap(rows);
  const platform = map.get(null);
  const currencyDefault = platform?.currency ?? "SAR";

  const workshopIds = filterWorkshopId
    ? [filterWorkshopId]
    : [
        ...new Set(
          rows
            .map((r) => r.workshop_id)
            .filter((id): id is string => id != null && id.length > 0)
        ),
      ];

  const attached = await attachPricingToWorkshopIds(workshopIds);

  return {
    currency_default: currencyDefault,
    platform: {
      workshop_sar: platform?.workshopSar ?? null,
      field_sar: platform?.fieldSar ?? null,
    },
    workshops: workshopIds.map((workshop_id) => {
      const p = attached.get(workshop_id);
      return {
        workshop_id,
        workshop_sar: p?.workshopSar ?? null,
        field_sar: p?.fieldSar ?? null,
        currency: p?.currency ?? currencyDefault,
      };
    }),
  };
}
