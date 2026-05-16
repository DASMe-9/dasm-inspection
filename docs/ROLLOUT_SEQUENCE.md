# تسليم منطقي مرقم — تنفيّذ كل العناصر بالترتيب (`dasm-inspection`)

لا تخطّ المراحل؛ كل خطوة تفترض نجاح السابقة على **staging** قبل الإنتاج.

## 1) تشغيل ومراقبة (خارج الكود جزئياً)

1. تأكّد أن الموقع **`inspect.dasm.com.sa`** يحمّل (انظر قائمة الدخّن في [`RUNBOOK.md`](./RUNBOOK.md)).
2. في Vercel → **Project settings** → **Log Drains**: أضف وجهة واضبط قواعد التنبيه كما في [`INSPECTION_OPS_ALERTING.md`](./INSPECTION_OPS_ALERTING.md) §2.
3. نفّذ **دخّن وظيفي** قصير: تسجيل دخول → طلب جديد أو فتح طلب موجود → رفع ملف صغير (حتى لو بيئة اختبار مكافئة للإنتاج).

## 2) أمان JWT + RLS قراءة `authenticated`

1. اتبع [`JWT_ROLLOUT.md`](./JWT_ROLLOUT.md): **staging أولاً** مع `DASM_JWT_ENFORCE=true` ومطابقة مطالبات التوكن لـ **`normalizeInspectionClaims`** في الكود (`inspection_role`, `workshop_id` / `organization_id`, `inspector_record_id`, `dasm_user_id`).
2. طبّق الهجرات تحت **`supabase/migrations/`** على مشروع Supabase (DASM-services) بالترتيب الزمني:
   - إن لم تكن مطبَّقة: **`rls_deny_authenticated_direct_access`**
   - ثم **`inspection_jwt_helpers_and_authenticated_select`** (قراءة `SELECT` условية لدور `authenticated` عبر `auth.jwt()`).
3. تحقَّق أن **PostgREST** مع جلسة مستخدم حقيقية ترى الصفوف المتوقَّعة فقط (وليس كل الجدول)، وأن **`service_role`** على التطبيق ما زال يعمل للكتابة عبر الخادم.

## 3) قائمة الفحص (منتج البنود الأولية)

1. المصدر الموحَّد للبنود الافتراضية عند **«إرسال التقرير للمراجعة»** هو **`frontend/src/lib/checklist/default-report-items.ts`** (ليست قائمة فارغة في الواجهة بعد إنشاء التقرير).
2. لتغيير البنود: عدِّل ذلك الملف ثم انشر؛ لاحقاً يمكن استبداله بجدول قوالب دون كسر مسار الواجهة الحالي (`ChecklistForm` يقرأ من DB).

## 4) محاذاة أدوار تاريخية في Postgres

1. بعد نشر هجرة **`inspection_backfill_workshop_manager_roles`**: تأكَّد بتقرير `SELECT COUNT(*)` قبل/بعد أو عيِّن نافذة صيانة قصيرة.
2. وحِّد JWT وواجهة المنصّة على الأدوار المعتمدة في [`V1_SCOPE.md`](./V1_SCOPE.md) و[`permissions-matrix.md`](./permissions-matrix.md).
