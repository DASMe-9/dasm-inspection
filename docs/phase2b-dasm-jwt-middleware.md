# Phase 2b — تنفيذ: middleware JWT + طبقة خادم + قالب RLS لـ staging

## ما الذي يُفعَّل

| المكوّن | الوصف |
|---------|--------|
| `frontend/src/middleware.ts` | عند `DASM_JWT_ENFORCE=true` يتحقق من JWT (iss/aud/exp + توقيع) ويمرّر مطالبات موحّدة كرؤوس داخلية موثوقة. |
| `frontend/src/lib/auth/*` | استخراج التوكن، التحقق (HS256 أو JWKS)، توحيد المطالبات، تطبيق الرؤوس، قراءة السياق على الخادم. |
| `frontend/src/lib/auth/access-layer.server.ts` | `assertInspectionRoles` / `requireInspectionAuthContext` للاستخدام **الاختياري** لاحقاً — غير موصول بـ Server Actions حالياً. |
| `supabase/staging/phase2b_rls_template.sql` | قالب RLS لـ **staging فقط** (خارج `migrations/`). |

## الافتراضي (عدم كسر الإنتاج)

- `DASM_JWT_ENFORCE` غير مضبوط أو ليس `true` → **لا يُنفَّذ** التحقق؛ السلوك السابق كما هو.

## متغيرات البيئة

انظر `frontend/.env.example`.

## اختبارات الوحدة

```bash
cd frontend && npm run test:unit
```

تغطي: توحيد المطالبات لمسارات admin / workshop_owner / inspector / dasm_user، وقبول/رفض JWT (HS256) حسب issuer/expiry.

## RLS على staging

اتبع `supabase/staging/README.md`. لا تنسخ ملف القالب إلى `migrations/` حتى لا يُطبَّق على الإنتاج.
