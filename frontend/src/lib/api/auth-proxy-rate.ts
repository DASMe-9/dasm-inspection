/** منطق حدّ وكيل المصادقة — نقيّ، بلا server-only/next، ليبقى قابلاً للاختبار. */

/** حدّ طلبات وكيل المصادقة بالدقيقة لكل عنوان؛ ≤0 أو غير رقم يعطّل الحد. */
export function authProxyLimitPerMin(): number {
  const raw = process.env.AUTH_PROXY_RATE_LIMIT_PER_MIN;
  const n = raw == null || raw === "" ? 20 : Number(raw);
  return Number.isFinite(n) ? n : 20;
}

/** قرار نقيّ: هل يُسمح بطلب إضافي ضمن النافذة؟ (limit≤0 = معطّل). */
export function isAuthRequestAllowed(recentCount: number, limit: number): boolean {
  if (limit <= 0) return true;
  return recentCount < limit;
}
