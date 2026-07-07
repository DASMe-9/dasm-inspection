import { findMissingCriticalEnv } from "@/lib/env-check";

/**
 * يعمل مرّة عند إقلاع الخادم (Next instrumentation hook).
 * يسجّل تحذيرًا واحدًا يسرد أي متغيّرات بيئة حرجة مفقودة — بدل اكتشافها لاحقًا
 * عبر فشل صامت (مزامنة Core، البوابة، Supabase). لا يرمي حتى لا يكسر الإقلاع.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const missing = findMissingCriticalEnv(process.env);
  if (missing.length === 0) {
    console.warn(
      JSON.stringify({
        inspection_ops: true,
        level: "warn",
        event: "env_check_ok",
        ts: new Date().toISOString(),
      })
    );
    return;
  }

  console.error(
    JSON.stringify({
      inspection_ops: true,
      level: "error",
      event: "env_check_missing_critical",
      ts: new Date().toISOString(),
      missing,
    })
  );
}
