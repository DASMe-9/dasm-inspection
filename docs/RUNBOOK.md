# Runbook — تشغيل فحص داسم (`dasm-inspection`)

## بعد كل نشر على Vercel

1. افتح **`inspect.dasm.com.sa`** وتأكد أن الصفحة تحمّل بدون أخطاء وحدة التحكم.
2. مسار سريع: تسجيل الدخول → **طلبات الفحص** → فتح طلب → **رفع مرفق صغير** (صورة أو PDF حتى 8 ميغابايت).
3. إن فشل الرفع: تحقق من وجود دلو **`inspection-attachments`** في مشروع Supabase **DASM-services** وهجرات **`storage_inspection_attachments_bucket`** و **`rls_deny_authenticated_direct_access`** المطبَّقة.
4. سياسات **Storage (`storage.objects`)**: تأكد من تطبيق هجرة **`storage_objects_inspection_attachments_lockdown`** (سياسات RESTRICTIVE لمنع الوصول المباشر من أدوار `authenticated` و`anon` إلى دلو المرفقات). بدونها قد يعمل الرفع من الخادم (service role) لكن يظل خطر تعرّض الدلو لسياسات permissive قديمة.

## متغيرات بيئة إلزامية (مرجع)

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (خادم فقط)
- اختياري: `INSPECTION_ATTACHMENTS_BUCKET`، `INSPECTION_ATTACHMENT_SIGNED_URL_TTL_SEC`
- بوابة: `DASM_GATEWAY_API_KEYS`, `DASM_API_URL`
- JWT إن فُعّل: `DASM_JWT_ENFORCE=true` + متغيرات التحقق في `.env.example`

## سجلات التشغيل (`inspection_ops`)

- الخادم يطبع أسطر **JSON** على stderr عند أعطال تشغيلية محددة (بدون محتوى ملفات وبدون أسرار):
  - **`attachment_upload_failed`** / **`attachment_db_insert_failed`** / **`attachment_upload_exception`** — رفع المرفقات من Server Action.
  - **`attachment_signed_url_failed`** / **`attachment_signed_url_skip_no_client`** — توليد روابط التحميل الموقّعة في `getAttachmentsWithSignedUrls`.
  - **`gateway_create_request_no_db_client`** / **`gateway_create_request_insert_failed`** / **`gateway_create_request_history_failed`** — إنشاء الطلب عبر البوابة أو REST v1.
- كل سطر يتضمن `"inspection_ops": true` و`event` و`ts`. على **Vercel**: Deployments → Logs → ابحث عن `inspection_ops` أو اسم الحدث.

## حادثة أمان مشبوهة

- إذا سُرّب مفتاح **publishable**: لا يزال مسار الجداول محميًا بعد هجرة **إغلاق authenticated المباشر**؛ غيّر المفتاح من لوحة Supabase وراقب السجلات.

## جهات اتصال تقنية

- الريبو: `DASMe-9/dasm-inspection`
- قاعدة بيانات الفحص: مشروع Supabase **DASM-services** (حسب ترابط الفريق الحالي)
