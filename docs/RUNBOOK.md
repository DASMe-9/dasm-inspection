# Runbook — تشغيل فحص داسم (`dasm-inspection`)

## بعد كل نشر على Vercel

1. افتح **`inspect.dasm.com.sa`** وتأكد أن الصفحة تحمّل بدون أخطاء وحدة التحكم.
2. مسار سريع: تسجيل الدخول → **طلبات الفحص** → فتح طلب → **رفع مرفق صغير** (صورة أو PDF حتى 8 ميغابايت).
3. إن فشل الرفع: تحقق من وجود دلو **`inspection-attachments`** في مشروع Supabase **DASM-services** وهجرات **`storage_inspection_attachments_bucket`** و **`rls_deny_authenticated_direct_access`** المطبَّقة.

## متغيرات بيئة إلزامية (مرجع)

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (خادم فقط)
- اختياري: `INSPECTION_ATTACHMENTS_BUCKET`، `INSPECTION_ATTACHMENT_SIGNED_URL_TTL_SEC`
- بوابة: `DASM_GATEWAY_API_KEYS`, `DASM_API_URL`
- JWT إن فُعّل: `DASM_JWT_ENFORCE=true` + متغيرات التحقق في `.env.example`

## حادثة أمان مشبوهة

- إذا سُرّب مفتاح **publishable**: لا يزال مسار الجداول محميًا بعد هجرة **إغلاق authenticated المباشر**؛ غيّر المفتاح من لوحة Supabase وراقب السجلات.

## جهات اتصال تقنية

- الريبو: `DASMe-9/dasm-inspection`
- قاعدة بيانات الفحص: مشروع Supabase **DASM-services** (حسب ترابط الفريق الحالي)
