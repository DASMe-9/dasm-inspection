import type { JWTPayload } from "jose";

/** مطالبات موحّدة داخل inspection بعد التحقق من JWT (لا تُستنتج من رؤوس الطلب الخام). */
export type NormalizedInspectionClaims = {
  userId: string;
  dasmRoles: string[];
  inspectionRole: string | null;
  workshopId: string | null;
  inspectorRecordId: string | null;
};

function readString(payload: JWTPayload, key: string): string | null {
  const v = payload[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function readStringArray(payload: JWTPayload, key: string): string[] {
  const v = payload[key];
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  }
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

/**
 * يقرأ مطالبات DASM / SSO ويُخرج شكلاً موحّداً لاستخدامه في middleware والخادم.
 * يدعم أسماء مطالبات بديلة شائعة (user_id / sub).
 */
export function normalizeInspectionClaims(payload: JWTPayload): NormalizedInspectionClaims {
  const sub = typeof payload.sub === "string" && payload.sub.trim() ? payload.sub.trim() : "";
  const dasmUserId =
    readString(payload, "dasm_user_id") ?? readString(payload, "user_id") ?? null;
  const userId = dasmUserId ?? sub;

  const dasmRoles = [
    ...readStringArray(payload, "dasm_roles"),
    ...readStringArray(payload, "dasm_role"),
  ];
  const singleRole = readString(payload, "dasm_role");
  if (singleRole && !dasmRoles.includes(singleRole)) dasmRoles.push(singleRole);

  return {
    userId,
    dasmRoles,
    inspectionRole:
      readString(payload, "inspection_role") ?? readString(payload, "inspectionRole"),
    workshopId: readString(payload, "workshop_id") ?? readString(payload, "organization_id"),
    inspectorRecordId:
      readString(payload, "inspector_record_id") ?? readString(payload, "inspector_id"),
  };
}
