/** حالة مزامنة التقرير إلى Core — نوع نقيّ + تعيين، بلا server-only ليبقى قابلاً للاختبار. */
export type CoreSyncStatus = "synced" | "failed" | "skipped";

/** يترجم نتيجة الدفع إلى حالة دائمة: نجاح→synced، تخطٍّ (توكن مفقود/معطّل)→skipped، غيره→failed. */
export function mapSyncResultToStatus(result: {
  ok: boolean;
  skipped?: boolean;
}): CoreSyncStatus {
  if (result.ok) return "synced";
  if (result.skipped) return "skipped";
  return "failed";
}
