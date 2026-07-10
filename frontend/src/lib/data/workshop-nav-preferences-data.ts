import "server-only";

import {
  parseHiddenNavKeys,
  type WorkshopCustomizableNavKey,
} from "@/lib/auth/workshop-nav-preferences";
import { getAdminClient } from "@/lib/supabase/admin";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";

export async function getWorkshopHiddenNavKeys(
  workshopId: string
): Promise<InspectionNavKey[]> {
  const id = workshopId?.trim();
  if (!id) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_workshops")
    .select("sidebar_hidden_nav_keys")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return [];
  return parseHiddenNavKeys(data.sidebar_hidden_nav_keys);
}

export async function saveWorkshopHiddenNavKeys(
  workshopId: string,
  hidden: readonly WorkshopCustomizableNavKey[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const id = workshopId?.trim();
  if (!id) return { ok: false, message: "معرّف الورشة مطلوب." };

  const sb = getAdminClient();
  if (!sb) return { ok: false, message: "قاعدة الفحص غير مهيأة." };

  const { error } = await sb
    .from("inspection_workshops")
    .update({ sidebar_hidden_nav_keys: [...hidden] })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر حفظ تفضيلات الشريط." };
  }

  return { ok: true };
}
