import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import { mapWorkshop } from "@/lib/data/mappers";
import type { Workshop } from "@/types";

/** أول ورشة غير موقوفة مرتبطة بمالك المنصّة (owner_user_id = users.id). */
export async function findWorkshopIdByOwnerUserId(
  ownerUserId: string
): Promise<string | null> {
  const key = ownerUserId?.trim();
  if (!key) return null;

  const sb = getAdminClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("inspection_workshops")
    .select("id")
    .eq("owner_user_id", key)
    .eq("is_suspended", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id as string;
}

export async function findWorkshopByOwnerUserId(
  ownerUserId: string
): Promise<Workshop | null> {
  const workshopId = await findWorkshopIdByOwnerUserId(ownerUserId);
  if (!workshopId) return null;

  const sb = getAdminClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("inspection_workshops")
    .select("*")
    .eq("id", workshopId)
    .maybeSingle();

  if (error || !data) return null;
  return mapWorkshop(data as Parameters<typeof mapWorkshop>[0]);
}
