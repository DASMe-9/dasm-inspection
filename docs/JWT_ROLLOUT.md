# تدريج تفعيل `DASM_JWT_ENFORCE` — فحص داسم

**حالة تشغيل (إنتاج):** ✅ على **Vercel** لمشروع **`dasm-inspection`** ضمن بيئة **Production** تم ضبط **`DASM_JWT_ENFORCE=true`**؛ يحدث **إعادة نشر** عند إضافة/تعديل المتغير. **يجب** بقاء **`DASM_JWT_ISSUER`** وإمّا **`DASM_JWT_SECRET`** أو **`DASM_JWKS_URI`** مضبوطة هناك (انظر أسفله و**`frontend/.env.example`** و**`verify-dasm-jwt.ts`**).

## الهدف

عند **`DASM_JWT_ENFORCE=true`** يطبّق التطبيق حواجز خادمية (`assertInspectionMutationAllowed` والمسارات المربوطة بـ Middleware) وفق JWT مُحقَّق. يجب ألا يُفعَّل الإنتاج قبل أن تصدر المنصّة توكنًا يضم **`inspection_role`** والمعرِّفات المرتبطة كما يقرؤها **`frontend/src/lib/auth/normalize-claims.ts`**.

## مطالبات يجب أن تظهر في JWT (أو أسماها البديلة المدعومة)

| المفهوم | مفاتيح مدعومة في الكود |
|---------|-------------------------|
| دور الفحص | `inspection_role` أو `inspectionRole` |
| ورشة | `workshop_id` أو `organization_id` |
| سجل المفتّش | `inspector_record_id` أو `inspector_id` |
| مستخدم المنصّة (عميل) | `dasm_user_id` أو `user_id` أو `sub` |

أدوار المعالجة على الخادم / التنقل: انظر **`resolveInspectionPersona`** (`workshop_manager` ما زال معروفاً في الواجهة للتوافق؛ RLS تقرأ `workshop_owner` و`workshop_manager` حيث وُثّقت).

## تسليم staging → الإنتاج

1. **Staging:** اضبط `.env` (أو لوحة Vercel) بالقيم الفعلية:
   - `DASM_JWT_ENFORCE=true`
   - Issuer/JWKS أو Secret حسب خوارزمية التوقيع (انظر **`frontend/.env.example`**).
2. **Smoke على staging:** كل مسارات الطلب الفاحص المعتادة (قراءة، إسناد إن كان مسموحاً، مرفقات) بدون خطأ **`INSPECTION_AUTH_REQUIRED`** أو حلقات إعادة توجيه غير مقصودة.
3. **قاعدة البيانات:** طبّق هجرة **`inspection_jwt_helpers_and_authenticated_select`** بحيث لا يعتمد الوصول العميق من PostgREST إلا على توكن سليم؛ يبقى مسار الخادم بـ **`service_role`** للكتابات في V1 الحالي.
4. **Production:** بعد نجاح تجارب staging وموافقة المالك:
   - فعّل نفس المتغيرات على بيئة الإنتاج؛
   - راقب Vercel logs لـ **`inspection_ops`** ساعات أولى؛
   - عند الانحراف كبير، أعد **`DASM_JWT_ENFORCE=false`** مؤقتاً (إجراء تشغيلي) وراجع الهوية المركزية.

## مراجع

- [`RUNBOOK.md`](./RUNBOOK.md) — متغيرات البيئة
- [`rls-policies.md`](./rls-policies.md) — سياسات RLS المفصّلة
- قالب تجريبي (لا يُشغَّل بواسطة CLI على الإنتاج): `supabase/staging/phase2b_rls_template.sql`
