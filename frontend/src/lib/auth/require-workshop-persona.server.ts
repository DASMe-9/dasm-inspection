import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveInspectionPersona } from "./resolve-inspection-persona";
import { isWorkshopDashboardRole } from "./workshop-dashboard";

/**
 * حارس صفحات الورشة الماليّة (الاشتراك/المحفظة) — إخفاء الناف تجميليّ فقط؛ هذا هو
 * المنع الفعلي: يُحلّ الشخصية خادميّاً ويعيد توجيه أي دور غير ورشة/أدمن، فلا يرى
 * عميل (dasm_user) جدول شرائح عمولة الورشة B2B حتى بلصق الرابط مباشرةً.
 *
 * يُستخدم في `layout.tsx` خادمي للمقطع؛ عند المنع يستدعي `redirect()` (يرمي ولا يعود).
 */
export async function requireWorkshopDashboardPersona(
  redirectTo = "/dashboard"
): Promise<void> {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const { persona } = resolveInspectionPersona(headersList, cookieStore);

  if (!isWorkshopDashboardRole(persona)) {
    redirect(redirectTo);
  }
}
