import "server-only";

import type { ResolvedInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import {
  INSPECTION_HEADER_VERIFIED,
  INSPECTION_HEADER_WORKSHOP_ID,
} from "@/lib/auth/inspection-headers";
import { findWorkshopIdByOwnerUserId } from "@/lib/data/workshop-owner-data";
import { headers } from "next/headers";
import {
  type WorkshopDashboardAccess,
  isWorkshopDashboardRole,
  isWorkshopOperatorRole,
} from "@/lib/auth/workshop-dashboard";

/** معرف الورشة من سياق JWT (بعد middleware) أو من رؤوس الطلب. */
export async function resolveWorkshopIdFromAuth(): Promise<string | null> {
  const ctx = await getInspectionAuthContext();
  if (ctx?.workshopId?.trim()) return ctx.workshopId.trim();

  const h = await headers();
  if (h.get(INSPECTION_HEADER_VERIFIED) !== "1") return null;
  const fromHeader = h.get(INSPECTION_HEADER_WORKSHOP_ID)?.trim();
  return fromHeader || null;
}

/** سياق لوحة الورشة من JWT (إلزامي لمالك/مدير الورشة). */
export async function getWorkshopDashboardAccess(
  personaCtx: ResolvedInspectionPersona,
  options?: { workshopIdOverride?: string | null }
): Promise<WorkshopDashboardAccess> {
  const persona = personaCtx.persona;

  if (!isWorkshopDashboardRole(persona)) {
    return {
      allowed: false,
      workshopId: null,
      persona,
      reason: "هذه اللوحة مخصّصة لمالك الورشة أو مديرها.",
    };
  }

  const override = options?.workshopIdOverride ?? null;
  const fromAuth = await resolveWorkshopIdFromAuth();
  let workshopId = override ?? fromAuth;

  if (isWorkshopOperatorRole(persona) && !workshopId) {
    const platformUserId =
      personaCtx.platformUserId?.trim() || (await resolveDasmUserId());
    if (platformUserId) {
      workshopId = await findWorkshopIdByOwnerUserId(platformUserId);
    }
  }

  if (isWorkshopOperatorRole(persona) && !workshopId) {
    return {
      allowed: false,
      workshopId: null,
      persona,
      reason:
        "لم يُربط حسابك بورشة بعد. تأكد من اعتماد طلب الانضمام بحساب داسم نفسه أو تواصل مع الإدارة.",
    };
  }

  return {
    allowed: true,
    workshopId,
    persona,
  };
}
