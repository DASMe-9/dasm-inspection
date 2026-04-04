import "server-only";

import { headers } from "next/headers";
import {
  INSPECTION_HEADER_DASM_ROLES,
  INSPECTION_HEADER_INSPECTOR_RECORD_ID,
  INSPECTION_HEADER_INSPECTION_ROLE,
  INSPECTION_HEADER_USER_ID,
  INSPECTION_HEADER_VERIFIED,
  INSPECTION_HEADER_WORKSHOP_ID,
} from "./inspection-headers";
import type { NormalizedInspectionClaims } from "./normalize-claims";

/**
 * يقرأ سياق الهوية بعد نجاح middleware (DASM_JWT_ENFORCE=true).
 * عند تعطيل الإنفاذ يعيد null — يبقى السلوك الحالي (service role) كما هو.
 */
export async function getInspectionAuthContext(): Promise<NormalizedInspectionClaims | null> {
  if (process.env.DASM_JWT_ENFORCE !== "true") {
    return null;
  }

  const h = await headers();
  if (h.get(INSPECTION_HEADER_VERIFIED) !== "1") {
    return null;
  }

  const userId = h.get(INSPECTION_HEADER_USER_ID)?.trim();
  if (!userId) return null;

  let dasmRoles: string[] = [];
  try {
    const raw = h.get(INSPECTION_HEADER_DASM_ROLES);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      dasmRoles = parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    dasmRoles = [];
  }

  const inspectionRole = h.get(INSPECTION_HEADER_INSPECTION_ROLE)?.trim() || null;
  const workshopId = h.get(INSPECTION_HEADER_WORKSHOP_ID)?.trim() || null;
  const inspectorRecordId =
    h.get(INSPECTION_HEADER_INSPECTOR_RECORD_ID)?.trim() || null;

  return {
    userId,
    dasmRoles,
    inspectionRole,
    workshopId,
    inspectorRecordId,
  };
}
