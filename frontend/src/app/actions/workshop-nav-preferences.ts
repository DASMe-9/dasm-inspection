"use server";

import { revalidatePath } from "next/cache";
import { getWorkshopDashboardAccess } from "@/lib/auth/workshop-dashboard.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import {
  parseHiddenNavKeys,
  WORKSHOP_CUSTOMIZABLE_NAV_KEYS,
  type WorkshopCustomizableNavKey,
} from "@/lib/auth/workshop-nav-preferences";
import { saveWorkshopHiddenNavKeys } from "@/lib/data/workshop-nav-preferences-data";
import { cookies, headers } from "next/headers";

export type WorkshopNavPrefsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveWorkshopNavPreferencesAction(
  formData: FormData
): Promise<WorkshopNavPrefsResult> {
  const workshopId = String(formData.get("workshop_id") ?? "").trim();
  if (!workshopId) {
    return { ok: false, message: "معرّف الورشة مطلوب." };
  }

  const headersList = await headers();
  const cookieStore = await cookies();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const access = await getWorkshopDashboardAccess(personaCtx, {
    workshopIdOverride: workshopId,
  });

  if (!access.allowed || access.workshopId !== workshopId) {
    return { ok: false, message: "صلاحية تعديل تفضيلات الشريط غير متوفرة." };
  }

  const raw = formData.getAll("hidden_nav_keys");
  const hidden = parseHiddenNavKeys(raw).filter((k) =>
    (WORKSHOP_CUSTOMIZABLE_NAV_KEYS as readonly string[]).includes(k)
  ) as WorkshopCustomizableNavKey[];

  const result = await saveWorkshopHiddenNavKeys(workshopId, hidden);
  if (!result.ok) return result;

  revalidatePath("/workshop");
  revalidatePath("/workshop/profile");
  revalidatePath("/settings");

  return { ok: true };
}
