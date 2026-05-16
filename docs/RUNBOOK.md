# Runbook — تشغيل فحص داسم (`dasm-inspection`)

**تسليم مرقم (Log Drain، JWT، RLS، قائمة الفحص، الأدوار):** اتبع أولًا [`ROLLOUT_SEQUENCE.md`](./ROLLOUT_SEQUENCE.md).

## بعد كل نشر على Vercel

1. (اختياري آلي) من جذر الريبو:
   ```powershell
   pwsh -File scripts/smoke-inspect-production.ps1
   ```
2. افتح **`inspect.dasm.com.sa`** وتأكد أن الصفحة تحمّل بدون أخطاء وحدة التحكم.
3. مسار سريع: تسجيل الدخول → **طلبات الفحص** → فتح طلب → **رفع مرفق صغير** (صورة أو PDF حتى 8 ميغابايت).
4. إن فشل الرفع: تحقق من وجود دلو **`inspection-attachments`** في مشروع Supabase **DASM-services** وهجرات **`storage_inspection_attachments_bucket`** و **`rls_deny_authenticated_direct_access`** المطبَّقة.
5. سياسات **Storage (`storage.objects`)**: تأكد من تطبيق هجرة **`storage_objects_inspection_attachments_lockdown`** (سياسات RESTRICTIVE لمنع الوصول المباشر من أدوار `authenticated` و`anon` إلى دلو المرفقات). بدونها قد يعمل الرفع من الخادم (service role) لكن يظل خطر تعرّض الدلو لسياسات permissive قديمة.

## Log Drains وتنبيهات الإنتاج (بالترتيب)

بعد تأكّد الوظائف الأساسية أعلاه:

1. افتح دليل **`INSPECTION_OPS_ALERTING.md`** واتبع **§2 Log Drain** خطوة بخطوة على مشروع **`dasm-inspection`** في Vercel (وجهة Datadog/OpenObserve أو ما يعتمدونه).
2. فعّل قاعدة تنبيه تطابق **`"inspection_ops":true`** و **`"level":"error"`** وأحداث الـ **`event`** الحرجة المذكورة في الوثيقة.
3. نفّذ دخّنًا قصيرًا يُولِّد حدًا معروفًا (مثل رفع مرفق سليم أو طلب اختبار) وتأكد أن السطور JSON تصل للوجّة.

### Smoke DB — تحقق سريع (قراءة فقط، لمشرفي قاعدة البيانات)

بعد أي نشر لهجرات الأمان على مشروع **DASM-services**:

```sql
-- جداول الفحص: سياسات رفض authenticated المباشر
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'inspection_%'
ORDER BY tablename, policyname;

-- Storage: سياسات RESTRICTIVE على دلو inspection-attachments
SELECT policyname, roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'inspection_attachments_storage_restrict_%';

-- بعد هجرة 20260518100000_inspection_jwt_helpers_and_authenticated_select:
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'inspection_%'
  AND policyname LIKE '%_select_jwt_authenticated'
ORDER BY tablename;
```

## متغيرات بيئة إلزامية (مرجع)

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (خادم فقط)
- اختياري: `INSPECTION_ATTACHMENTS_BUCKET`، `INSPECTION_ATTACHMENT_SIGNED_URL_TTL_SEC`
- بوابة: `DASM_GATEWAY_API_KEYS`, `DASM_API_URL`
- JWT إن فُعّل: `DASM_JWT_ENFORCE=true` + متغيرات التحقق في `.env.example` — التدريج: [`JWT_ROLLOUT.md`](./JWT_ROLLOUT.md)

## سجلات التشغيل (`inspection_ops`)

- الخادم يطبع أسطر **JSON** على stderr عند أعطال تشغيلية محددة (بدون محتوى ملفات وبدون أسرار):
  - **`attachment_upload_failed`** / **`attachment_db_insert_failed`** / **`attachment_upload_exception`** — رفع المرفقات من Server Action.
  - **`attachment_signed_url_failed`** / **`attachment_signed_url_skip_no_client`** — توليد روابط التحميل الموقّعة في `getAttachmentsWithSignedUrls`.
  - **`gateway_create_request_no_db_client`** / **`gateway_create_request_insert_failed`** / **`gateway_create_request_history_failed`** — إنشاء الطلب عبر البوابة أو REST v1.
- كل سطر يتضمن `"inspection_ops": true` و`event` و`ts`. على **Vercel**: Deployments → Logs → ابحث عن `inspection_ops` أو اسم الحدث.
- **تنبيهات إنتاجية:** انظر **[`INSPECTION_OPS_ALERTING.md`](./INSPECTION_OPS_ALERTING.md)** (Log Drains، فلترة `level:error`).

## حادثة أمان مشبوهة

- إذا سُرّب مفتاح **publishable**: لا يزال مسار الجداول محميًا بعد هجرة **إغلاق authenticated المباشر**؛ غيّر المفتاح من لوحة Supabase وراقب السجلات.

## جهات اتصال تقنية

- الريبو: `DASMe-9/dasm-inspection`
- قاعدة بيانات الفحص: مشروع Supabase **DASM-services** (حسب ترابط الفريق الحالي)
