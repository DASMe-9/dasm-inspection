/** كوكي httpOnly يضبطه GET /api/gateway بعد التحقق من توكن المنصّة — لصفحة «طلباتي». */
export const INSPECTION_DASM_USER_COOKIE = "inspection_dasm_user_id";

/**
 * يضبطه GET /api/gateway عندما تعيد منصّة داسم حقل دور الفحص في `/api/user/profile`
 * (مثل inspection_role أو inspection_app_role). httpOnly؛ للعرض في الشريط الجانبي فقط —
 * لا يُعتمد عليه وحده للصلاحيات الحسّاسة (استخدم JWT + DASM_JWT_ENFORCE للإنفاذ).
 */
export const INSPECTION_UI_ROLE_COOKIE = "inspection_ui_role";
