# حالة التنفيذ مقابل الخطة — dasm-inspection

**تاريخ المراجعة:** 2026-05-17 — مزامنة مع الإنتاج: سياسات **JWT SELECT** + **backfill** الأدوار نُفِّذتا يدوياً على **Supabase → DASM-services → main PRODUCTION** (SQL Editor)، بنجاح التنفيذ (انظر أيضاً [`RUNBOOK.md`](./RUNBOOK.md) §Smoke DB).

**📌 مسار الإكمال المرقم (لا تضيع الأولويات):** انظر **[`COMPLETION_ROADMAP.md`](./COMPLETION_ROADMAP.md)** و **[`RUNBOOK.md`](./RUNBOOK.md)** للتشغيل بعد النشر.

---

## مقابل `V1_SCOPE.md` — المسارات

| المسار الموثَّق في V1 | الحالة في الكود |
|----------------------|-----------------|
| `/` لوحة تحكم | ✅ موجودة — KPI + روابط سريعة + أحدث الطلبات |
| `/requests` | ✅ قائمة + نموذج طلب جديد |
| `/requests/:id` | ✅ تفاصيل، سير عمل، قائمة فحص، خط زمني، **مرفقات برفع ولروابط تحميل موقّعة**؛ إلغاء الطلب من اللوحة |
| `/reports/:id` | ✅ تقرير + بنود + تعديل بند (`ReportChecklistRow` → `updateReportItemAction`) |
| `/workshops`, `/workshops/:id` | ✅ صفحة شبكة ورش (إحصاءات، بطاقات حديثة، روابط اشتراك/طلب) + تفصيل ورشة (بطل، جهات اتصال، مفتشون، CTAs) |
| `/settings` | ✅ موجودة (نصي/إعدادات) |
| `/my-inspections` | ✅ قائمة بحسب كوكي `inspection_dasm_user_id` (يُضبط من `GET /api/gateway`) |

**مسارات إضافية منفَّذة وغير مذكورة في جدول V1 السابق:**

| المسار | الغرض |
|--------|--------|
| `/track/:id` | عرض عميل مختصر لتتبع الطلب والحالة |
| `/subscription` | صفحة اشتراك الخدمة (ربط منتج المنصّة) |
| `/auth/login`, `/auth/callback` | دخول وتوجيه OAuth/جلسة |
| `GET/POST /api/gateway` | بوابة من DASM: توجيه + إنشاء طلب بمفتاح API + Bearer (توافق خلفي `{ success, data }`). |
| `POST /api/v1/inspection-requests`، `GET /api/v1/inspection-requests/:id` | REST v1 موثَّق في [`api-contract.md`](./api-contract.md)؛ مصادقة مفتاح الخدمة + Bearer؛ قراءة الطلب لمالك المنصّة فقط. |

---

## مقابل `EXECUTION_PLAN.md`

| المرحلة | الحالة الواقعية (ملخّص) |
|---------|-------------------------|
| **Phase 1** توثيق معماري | ✅ مكتمل في `docs/` |
| **Phase 2** تصميم هوية + هجرة enum | ✅ توثيق + هجرة `phase2_inspection_app_role_extend`؛ **تنفيذ JWT:** الكود موجود في `middleware.ts` + `verify-dasm-jwt` + `apply-inspection-headers` لكن **`DASM_JWT_ENFORCE` افتراضياً غير `true`** — أي الإنفاذ الخادمي اختياري. |
| **Phase 2b** RLS حازمة | ✅ **إغلاق الوصول المباشر لـ `authenticated` على جداول `inspection_*`:** مطبَّق على **DASM-services** (`rls_deny_authenticated_direct_access`). ✅ **قفل `storage.objects` للمرفقات:** مطبَّق (`storage_objects_inspection_attachments_lockdown`). ✅ **سياسات `SELECT` لـ `authenticated` عبر JWT + دالة `inspection_jwt_text_claim`:** مطبَّقة على **إنتاج DASM-services** (نفس منطق **`20260518100000_inspection_jwt_helpers_and_authenticated_select.sql`**؛ تنفيذ لوحة SQL). قالب تجريبي قديم: `supabase/staging/phase2b_rls_template.sql`. |
| **Phase 3** لوحات حسب الدور / فرز إنتاجي / Signed URLs للمرفقات | ✅ **فرز وفلترة + ورشة:** حالة الطلب على **`/requests`** و **`/my-inspections`**؛ فلتر **`workshop`** في query؛ تنقّل جانبي/سفلي بحسب **`inspection_role`** (JWT أو كوكي البوابة عند توفر الحقل من المنصّة). Signed URLs للمرفقات كما سبق. |
| **Phase 4** تقوية إنتاج | ✅ **`RUNBOOK`** + **`INSPECTION_OPS_ALERTING`**؛ حدّ معدّل الإنشاء؛ قفل **`storage.objects`**؛ سجلات **`inspection_ops`**. **اختياري لاحقاً:** ربط Log Drain فعلي على بيئة الإنتاج؛ تعزيز حدّ المعدّل على Edge/KV إن لزم. |

---

## مقابل `api-contract.md`

| الموثَّق | الواقع |
|----------|--------|
| 6 عمليات في `inspection-workflow.ts` | الكود يضيف **`updateReportItemAction`** لتعديل بند تقرير — يُحدَّث الجدول في نفس الملف بالوثائق. |
| `POST /api/v1/inspection-requests` | ✅ **منفَّذ:** مسار REST v1 مع `X-Dasm-Api-Key` + Bearer؛ **`GET /api/v1/inspection-requests/:id`** للمالك؛ **`POST /api/gateway`** يبقى للتوافق. التفاصيل في **`api-contract.md`**. |

---

## فجوات واضحة لإغلاقها لاحقاً (مرتبة بالأولوية المنطقية)

1. ~~**إلغاء الطلب `cancelled`:**~~ **`cancelInspectionRequestAction`** + زر في `RequestWorkflowPanel` (مع قيود الحالة).
2. ~~**رفع المرفقات + Storage:**~~ **`uploadInspectionAttachmentAction`** + عرض بروابط موقّعة؛ هجرة دلو `inspection-attachments`.
3. **ربط JWT إنفاذ بالـ Actions:** عند تشغيل `DASM_JWT_ENFORCE=true`، **`assertInspectionMutationAllowed`** في الإجراءات المتحوّلة (موجود في الكود؛ التفعيل بيئي).
4. ~~**إغلاق RLS السطحي:**~~ هجرة **`rls_deny_authenticated_direct_access`** على **DASM-services**. ~~**قفل `storage.objects` للمرفقات:**~~ **`storage_objects_inspection_attachments_lockdown`**. ✅ **سياسات `SELECT` لمستخدمي PostgREST بتوكن JWT:** مطبَّقة **إنتاجياً على DASM-services**؛ الملف المرجعي في **`supabase/migrations/20260518100000_inspection_jwt_helpers_and_authenticated_select.sql`**. ✅ **محاذاة `workshop_manager` → `workshop_owner`** في **`inspection_status_history` / `inspection_reports`** (سكربت **`20260518100500_…`**؛ «لا صفوف» يعني عدم وجود قيم للتحديث). **لاحقاً:** **`INSERT`/`UPDATE` مفصّلة للعميل** إن اُتخِذ ذلك — **`rls-policies.md`**.
5. ~~**صفحة `/my-inspections`:**~~ مضافة + كوكي من **`GET /api/gateway`** + ربط نموذج الطلب بـ `dasm_user_id`.
6. ~~**توحيد اسم API:**~~ **`POST /api/v1/inspection-requests`** + **`GET .../:id`** موثَّقة؛ **`POST /api/gateway`** للتوافق.

---

## الخلاصة

**المسار الوظيفي لـ V1 شغّال.** تم تعزيز الأمان الأولي على قاعدة البيانات بإغلاق الوصول المباشر لدور **`authenticated`** على جداول الفحص مع الإبقاء على **`service_role`** للخادم.

**ما يبقى «منتجياً/تشغيلياً»:** **مراقبة خارجية:** **Log Drain** على Vercel لـ **`inspection_ops`** ([`RUNBOOK.md`](./RUNBOOK.md)، [`INSPECTION_OPS_ALERTING.md`](./INSPECTION_OPS_ALERTING.md)). **أمان تطبيق:** تفعيل **`DASM_JWT_ENFORCE=true`** على بيئة **inspect.dasm.com.sa** وفق [**`JWT_ROLLOUT.md`**](./JWT_ROLLOUT.md) بعد smoke؛ اختبار اختياري أن عميل **`authenticated`** + JWT يرى فقط الصفوف المسموح بها على PostgREST. **تحسينات اختيارية:** حد معدّل موزَّع على Edge؛ سياسات **INSERT/UPDATE** للعميل إن اُتِّجه المنتج لذلك.
