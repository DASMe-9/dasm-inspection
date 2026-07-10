import "server-only";

import { findWorkshopIdByOwnerUserId } from "@/lib/data/workshop-owner-data";
import type { NormalizedInspectionClaims } from "./normalize-claims";

const WORKSHOP_OPERATOR_ROLES = new Set(["workshop_owner", "workshop_manager"]);

/**
 * يملأ workshop_id من owner_user_id عند غيابه في JWT — ضروري لمسار Sanctum/SSO
 * حيث لا تُضمَّن مطالبة الورشة في التوكن.
 */
export async function enrichWorkshopClaims(
  normalized: NormalizedInspectionClaims
): Promise<NormalizedInspectionClaims> {
  if (normalized.workshopId?.trim()) return normalized;

  const role = normalized.inspectionRole?.trim();
  if (!role || !WORKSHOP_OPERATOR_ROLES.has(role)) return normalized;

  const workshopId = await findWorkshopIdByOwnerUserId(normalized.userId);
  if (!workshopId) return normalized;

  return { ...normalized, workshopId };
}
