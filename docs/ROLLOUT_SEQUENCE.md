# تسليم منطقي مرقم — تنفيّذ كل العناصر بالترتيب (`dasm-inspection`)

لا تخطّ المراحل؛ كل خطوة تفترض نجاح السابقة على **staging** قبل الإنتاج.

## 1) تشغيل ومراقبة (خارج الكود جزئياً)

1. تأكّد أن الموقع **`inspect.dasm.com.sa`** يحمّل (انظر قائمة الدخّن في [`RUNBOOK.md`](./RUNBOOK.md)).
2. في Vercel → **Project settings** → **Log Drains**: أضف وجهة واضبط قواعد التنبيه كما في [`INSPECTION_OPS_ALERTING.md`](./INSPECTION_OPS_ALERTING.md) §2.
3. نفّذ **دخّن وظيفي** قصير: تسجيل دخول → طلب جديد أو فتح طلب موجود → رفع ملف صغير (حتى لو بيئة اختبار مكافئة للإنتاج).

## 2) أمان JWT + RLS قراءة `authenticated`

1. اتبع [`JWT_ROLLOUT.md`](./JWT_ROLLOUT.md): **staging أولاً** عند تجربة تغييرات هوية؛ **Production** لمشروع Vercel **`dasm-inspection`:** ✅ **`DASM_JWT_ENFORCE=true`** مع **`DASM_JWT_ISSUER`** + **`DASM_JWT_SECRET` أو `DASM_JWKS_URI`** كما **`frontend/.env.example`**.
2. طبّق الهجرات تحت **`supabase/migrations/`** على مشروع Supabase (**DASM-services**) بالترتيب الزمني (أو الاسكربت المركّز المطابق لهما في المراسلات)، ثم تأكَّد أن الناتج موجود في **`pg_policies`**، انظر **`RUNBOOK.md`**.
   - ✅ **إنتاج (`main`):** تنفيذ **JWT SELECT + backfill الأدوار** **موثَّق** (2026-05-17) بعد نجاح SQL Editor؛ إن لم تكن تنفَّذ بعد على نسختك، لا تخطَ **`rls_deny_authenticated_direct_access`** قبل سياسات القراءة.
3. تحقَّق أن **PostgREST** مع جلسة مستخدم حقيقية ترى الصفوف المتوقَّعة فقط (وليس كل الجدول)، وأن **`service_role`** على التطبيق ما زال يعمل للكتابة عبر الخادم.

## 3) قائمة الفحص (منتج البنود الأولية)

1. المصدر الموحَّد للبنود الافتراضية عند **«إرسال التقرير للمراجعة»** هو **`frontend/src/lib/checklist/default-report-items.ts`** (ليست قائمة فارغة في الواجهة بعد إنشاء التقرير).
2. لتغيير البنود: عدِّل ذلك الملف ثم انشر؛ لاحقاً يمكن استبداله بجدول قوالب دون كسر مسار الواجهة الحالي (`ChecklistForm` يقرأ من DB).

## 4) محاذاة أدوار تاريخية في Postgres

1. بعد نشر هجرة **`inspection_backfill_workshop_manager_roles`**: تأكَّد بتقرير `SELECT COUNT(*)` قبل/بعد أو عيِّن نافذة صيانة قصيرة.
2. وحِّد JWT وواجهة المنصّة على الأدوار المعتمدة في [`V1_SCOPE.md`](./V1_SCOPE.md) و[`permissions-matrix.md`](./permissions-matrix.md).
