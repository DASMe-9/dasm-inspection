/** رؤوس داخلية يضبطها middleware بعد التحقق من JWT فقط؛ يُزال أي قيمة واردة من العميل قبل الإسناد. */
export const INSPECTION_HEADER_VERIFIED = "x-inspection-jwt-verified";
export const INSPECTION_HEADER_USER_ID = "x-inspection-user-id";
export const INSPECTION_HEADER_DASM_ROLES = "x-inspection-dasm-roles";
export const INSPECTION_HEADER_INSPECTION_ROLE = "x-inspection-inspection-role";
export const INSPECTION_HEADER_WORKSHOP_ID = "x-inspection-workshop-id";
export const INSPECTION_HEADER_INSPECTOR_RECORD_ID = "x-inspection-inspector-record-id";

export const INSPECTION_INTERNAL_HEADERS = [
  INSPECTION_HEADER_VERIFIED,
  INSPECTION_HEADER_USER_ID,
  INSPECTION_HEADER_DASM_ROLES,
  INSPECTION_HEADER_INSPECTION_ROLE,
  INSPECTION_HEADER_WORKSHOP_ID,
  INSPECTION_HEADER_INSPECTOR_RECORD_ID,
] as const;
