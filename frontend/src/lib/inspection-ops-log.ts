import "server-only";

export type InspectionOpsLogLevel = "error" | "warn";

/**
 * سجل تشغيلي JSON على stderr (مناسب لـ Vercel / Docker / أي مجمّع يفهرس stdout/stderr).
 * لا يُسجَّل أي أسرار؛ أضف معرفات فقط (requestId، مسار تخزين، رموز أخطاء Supabase).
 */
export function inspectionOpsLog(
  level: InspectionOpsLogLevel,
  event: string,
  data: Record<string, unknown>
): void {
  const payload = {
    inspection_ops: true,
    level,
    event,
    ts: new Date().toISOString(),
    ...data,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else console.warn(line);
}
