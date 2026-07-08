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

/**
 * جمهور المحفظة — بخلاف الاشتراك (ورشة فقط)، المحفظة لها دلالتان:
 *  - `workshop`: أرباح/صرف الورشة (مالك/مدير/أدمن).
 *  - `customer`: رصيد مسبق الدفع للعميل (dasm_user) للفحوصات المتكرّرة — شحن وخصم
 *    فقط، لا يستقبل أرباحاً.
 *  - `none`: طاقم الميدان (فاحص/فنّي/عارض) والمجهول — لا محفظة.
 * تُحدّد أيّ عرض تُظهره صفحة /wallet بحسب الدور، فلا يرى العميل لغة صرف الورشة.
 */
export type WalletAudience = "workshop" | "customer" | "none";

export async function resolveWalletAudience(): Promise<WalletAudience> {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const { persona } = resolveInspectionPersona(headersList, cookieStore);
  if (isWorkshopDashboardRole(persona)) return "workshop";
  if (persona === "dasm_user") return "customer";
  return "none";
}
