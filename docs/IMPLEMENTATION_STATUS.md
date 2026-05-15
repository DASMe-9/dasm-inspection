# حالة التنفيذ مقابل الخطة — dasm-inspection

**تاريخ المراجعة:** 2026-05-15

**📌 مسار الإكمال المرقم (لا تضيع الأولويات):** انظر **[`COMPLETION_ROADMAP.md`](./COMPLETION_ROADMAP.md)** و **[`RUNBOOK.md`](./RUNBOOK.md)** للتشغيل بعد النشر.

---

## مقابل `V1_SCOPE.md` — المسارات

| المسار الموثَّق في V1 | الحالة في الكود |
|----------------------|-----------------|
| `/` لوحة تحكم | ✅ موجودة — KPI + روابط سريعة + أحدث الطلبات |
| `/requests` | ✅ قائمة + نموذج طلب جديد |
| `/requests/:id` | ✅ تفاصيل، سير عمل، قائمة فحص، خط زمني، **مرفقات برفع ولروابط تحميل موقّعة**؛ إلغاء الطلب من اللوحة |
| `/reports/:id` | ✅ تقرير + بنود + تعديل بند (`ReportChecklistRow` → `updateReportItemAction`) |
| `/workshops`, `/workshops/:id` | ✅ موجودان |
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
| **Phase 2b** RLS حازمة | ⚠️ **جزئي (2026-05-16):** هجرة **`rls_deny_authenticated_direct_access`** تزيل سياسات `USING (true)` وتمنع دور **`authenticated`** من الوصول المباشر؛ مسار التطبيق الرسمي يبقى **service role** من الخادم. **لم يُكمَّل بعد:** سياسات JWT الدقيقة حسب **`rls-policies.md`** عند ربط `auth.jwt()` فعلياً (قالب staging في `supabase/staging/`). |
| **Phase 3** لوحات حسب الدور / فرز إنتاجي / Signed URLs للمرفقات | ⚠️ **جزئي:** رفع مرفقات + signed URLs؛ واجهة موحَّدة بدون تقسيم مسارات حسب الدور؛ لا فرز متقدّم في الجداول. |
| **Phase 4** تقوية إنتاج | ⚠️ **جزئي:** **`RUNBOOK.md`** موثَّق؛ **منفَّذ:** حدّ معدّل إنشاء الطلبات في التطبيق (`INSPECTION_CREATE_RATE_LIMIT_PER_MIN`) على **`POST /api/gateway`** و **`POST /api/v1/inspection-requests`**؛ هجرة **قفل `storage.objects`** لدلو المرفقات. **ما يزال مفتوحاً:** مراقبة/تنبيهات موحّدة، وتعزيز حدّ المعدّل على طبقة Edge/KV إن لزم. |

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
4. ~~**إغلاق RLS السطحي:**~~ هجرة **`rls_deny_authenticated_direct_access`** (في المستودع + يُطبَّق على **DASM-services**). **التالي:** سياسات قراءة/كتابة مفصّلة مع JWT كما في **`rls-policies.md`**.
5. ~~**صفحة `/my-inspections`:**~~ مضافة + كوكي من **`GET /api/gateway`** + ربط نموذج الطلب بـ `dasm_user_id`.
6. ~~**توحيد اسم API:**~~ **`POST /api/v1/inspection-requests`** + **`GET .../:id`** موثَّقة؛ **`POST /api/gateway`** للتوافق.

---

## الخلاصة

**المسار الوظيفي لـ V1 شغّال.** تم تعزيز الأمان الأولي على قاعدة البيانات بإغلاق الوصول المباشر لدور **`authenticated`** على جداول الفحص مع الإبقاء على **`service_role`** للخادم.

**ما يبقى «منتجياً/تشغيلياً» قبل ادّعاء إغلاق كامل للوثائق:** سياسات RLS المعتمدة على مطالبات JWT حسب **`rls-policies.md`**، مراقبة موحّدة للرفع والـ API، ثم تحسينات واجهة إضافية (فرز، فلاتر، لوحات حسب الدور) في PRs مستقلة — انظر **`COMPLETION_ROADMAP.md`**.
