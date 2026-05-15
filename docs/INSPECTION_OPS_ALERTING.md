# تنبيهات سجلات `inspection_ops` — دليل تشغيلي

سجلات **`inspection_ops`** تُطبَع على **stderr** كأسطر **JSON** (انظر [`RUNBOOK.md`](./RUNBOOK.md)). هذا الدليل يغلق «المرحلة 6» من ناحية **قابلية المراقبة**: كيف تُفعَّل تنبيهات خارجية دون تغيير عقد التطبيق.

## 1) فلترة في Vercel (بدون تكامل خارجي)

1. افتح المشروع **`dasm-inspection`** → **Deployments** → **Logs**.
2. ابحث عن: `"inspection_ops":true` أو اسم الحدث (مثل `attachment_upload_failed`).
3. للأخطاء الحرجة استخدم مستوى السجل: `"level":"error"` في الحمولة JSON.

## 2) Log Drain (موصى به للإنتاج)

1. في Vercel: **Project Settings** → **Log Drains** (أو وفق واجهة الفريق الحالية).
2. أضف وجهة متوافقة (Datadog، Elastic، OpenObserve، webhook داخلي مع تحقّق توقيع).
3. على مستلم السجلات أن يُنشئ **قاعدة تنبيه** عندما:
   - يظهر النص `"inspection_ops":true` و **`"level":"error"`**، أو
   - يطابق **`event`** قائمة بالأحداث الحرجة، مثل:
     - `gateway_create_request_insert_failed`
     - `attachment_upload_failed`
     - `attachment_db_insert_failed`

## 3) حقول مفيدة في الحمولة

| الحقل | الاستخدام في التنبيه |
|-------|---------------------|
| `event` | تصفية نوع الخطأ |
| `level` | `error` vs `warn` |
| `ts` | زمن UTC ISO |
| `request_id` / `dasm_user_id` | تجميع وحوادث |

لا تُخزَّن أسرار أو مسارات حساسة غير الموثَّقة في [`RUNBOOK.md`](./RUNBOOK.md).

## 4) JWT والصلاحيات

تنبيهات السجلات **لا تغني** عن **`DASM_JWT_ENFORCE=true`** للمسارات التي يقررها الفريق؛ الإنفاذ الحقيقي للصلاحيات يبقى على الخادم والسياسات الموثَّقة في [`rls-policies.md`](./rls-policies.md).
