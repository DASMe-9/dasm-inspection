/**
 * فحص متغيّرات البيئة الحرجة عند الإقلاع — نقيّ وقابل للاختبار (بلا server-only/next).
 * يصنّف كل متغيّر: مفقود تمامًا (missing) أو موجود. لا يقرأ القيم للسجلّ — الأسماء فقط.
 */

/** متغيّر حرج: إن غاب تتعطّل وظيفة أساسية. `anyOf` = يكفي وجود أحد البدائل. */
export type CriticalEnvSpec = {
  key: string;
  anyOf?: string[];
  note: string;
};

export const CRITICAL_ENV: CriticalEnvSpec[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", note: "رابط Supabase — بلا = التطبيق لا يعمل" },
  {
    key: "SUPABASE_ANON_OR_PUBLISHABLE",
    anyOf: [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ],
    note: "مفتاح المتصفّح (أيّ الاسمين)",
  },
  { key: "SUPABASE_SERVICE_ROLE_KEY", note: "مفتاح الخدمة — كل كتابة خادمية" },
  {
    key: "DASM_INSPECTION_INTERNAL_PULL_TOKEN",
    note: "توكن جسر Core — بلا = مزامنة التقارير/المحفظة تفشل",
  },
  {
    key: "DASM_GATEWAY_API_KEYS",
    note: "مفاتيح البوابة — بلا = رفض إنشاء الطلبات عبر البوابة",
  },
];

function present(env: Record<string, string | undefined>, name: string): boolean {
  const v = env[name];
  return typeof v === "string" && v.trim() !== "";
}

/** يُرجع أسماء المتغيّرات الحرجة المفقودة (فارغة = كل شيء مضبوط). */
export function findMissingCriticalEnv(
  env: Record<string, string | undefined>,
  specs: CriticalEnvSpec[] = CRITICAL_ENV
): string[] {
  const missing: string[] = [];
  for (const spec of specs) {
    const ok = spec.anyOf
      ? spec.anyOf.some((n) => present(env, n))
      : present(env, spec.key);
    if (!ok) missing.push(spec.anyOf ? spec.anyOf.join(" | ") : spec.key);
  }
  return missing;
}
