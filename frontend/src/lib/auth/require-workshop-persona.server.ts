import "server-only";

import { cookies, headers } from "next/headers";
import { resolveInspectionPersona } from "./resolve-inspection-persona";
import { isWorkshopDashboardRole } from "./workshop-dashboard";

/**
 * حارس صفحات الورشة الماليّة (الاشتراك/المحفظة) — إخفاء الناف تجميليّ فقط؛ هذا هو
 * المنع الفعلي: يُحلّ الشخصية خادميّاً ويعيد ما إن كان الدور ورشة/أدمن. تستخدمه
 * صفحة خادميّة لتعرض «مخصّصة للورش» بدل جدول شرائح العمولة B2B لأي دور آخر، فلا
 * يراه عميل (dasm_user) حتى بلصق الرابط مباشرةً.
 *
 * يُتّبع نمط صفحات الورشة القائم (عرض شرطي داخل الصفحة) لا `redirect()` في تخطيط
 * متداخل — الأخير لا يُطلق التوجيه بثبات في هذا الإعداد.
 */
export async function resolveIsWorkshopFinancialViewer(): Promise<boolean> {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const { persona } = resolveInspectionPersona(headersList, cookieStore);
  return isWorkshopDashboardRole(persona);
}
