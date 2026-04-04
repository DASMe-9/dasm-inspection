import type { NormalizedInspectionClaims } from "./normalize-claims";
import {
  INSPECTION_HEADER_DASM_ROLES,
  INSPECTION_HEADER_INSPECTOR_RECORD_ID,
  INSPECTION_HEADER_INSPECTION_ROLE,
  INSPECTION_HEADER_USER_ID,
  INSPECTION_HEADER_VERIFIED,
  INSPECTION_HEADER_WORKSHOP_ID,
  INSPECTION_INTERNAL_HEADERS,
} from "./inspection-headers";

/** يزيل رؤوس inspection الداخلية ثم يعبئها من المطالبات المُوثَّقة فقط. */
export function applyInspectionHeaders(
  requestHeaders: Headers,
  normalized: NormalizedInspectionClaims
): void {
  for (const name of INSPECTION_INTERNAL_HEADERS) {
    requestHeaders.delete(name);
  }

  requestHeaders.set(INSPECTION_HEADER_VERIFIED, "1");
  requestHeaders.set(INSPECTION_HEADER_USER_ID, normalized.userId);
  requestHeaders.set(INSPECTION_HEADER_DASM_ROLES, JSON.stringify(normalized.dasmRoles));
  requestHeaders.set(
    INSPECTION_HEADER_INSPECTION_ROLE,
    normalized.inspectionRole ?? ""
  );

  if (normalized.workshopId) {
    requestHeaders.set(INSPECTION_HEADER_WORKSHOP_ID, normalized.workshopId);
  } else {
    requestHeaders.delete(INSPECTION_HEADER_WORKSHOP_ID);
  }

  if (normalized.inspectorRecordId) {
    requestHeaders.set(
      INSPECTION_HEADER_INSPECTOR_RECORD_ID,
      normalized.inspectorRecordId
    );
  } else {
    requestHeaders.delete(INSPECTION_HEADER_INSPECTOR_RECORD_ID);
  }
}
