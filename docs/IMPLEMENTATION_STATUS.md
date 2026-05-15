# حالة التنفيذ مقابل الخطة — dasm-inspection

**تاريخ المراجعة:** 2026-05-15 (مراجعة كود محلي في `frontend/` و`supabase/migrations/` و`docs/`).

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
| `GET/POST /api/gateway` | بوابة من DASM: توجيه + إنشاء طلب بمفتاح API (انظر الأسفل) |

---

## مقابل `EXECUTION_PLAN.md`

| المرحلة | الحالة الواقعية (ملخّص) |
|---------|-------------------------|
| **Phase 1** توثيق معماري | ✅ مكتمل في `docs/` |
| **Phase 2** تصميم هوية + هجرة enum | ✅ توثيق + هجرة `phase2_inspection_app_role_extend`؛ **تنفيذ JWT:** الكود موجود في `middleware.ts` + `verify-dasm-jwt` + `apply-inspection-headers` لكن **`DASM_JWT_ENFORCE` افتراضياً غير `true`** — أي الإنفاذ الخادمي اختياري. `assertInspectionRoles` لا يقيّد شيئاً ما لم يُفعَّل الإنفاذ. |
| **Phase 2b** RLS حازمة | ⚠️ الجداول **مفعّلة RLS** لكن سياسات V1 كلها **`USING (true)` لـ `authenticated`**؛ المنطق الفعلي للكتابة يمر عبر **service role** في Server Actions (`requireAdminClient`) — أي **ليست سياسات إنتاجية حازمة بعد**. قالب staging في `supabase/staging/` حسب الوثائق المنفصلة. |
| **Phase 3** لوحات حسب الدور / فرز إنتاجي / Signed URLs للمرفقات | ⚠️ **جزئي محدّث:** رفع مرفقات + signed URLs من الخادم + سكيلتون تحميل؛ واجهة موحَّدة بدون تقسيم مسارات حسب الدور؛ لا فرز متقدّم في الجداول. |
| **Phase 4** تقوية إنتاج | ❌ لم تُنجَز بعد (تصدير، Rate limit، Storage policies، Runbook موحّدة هنا). |

---

## مقابل `api-contract.md`

| الموثَّق | الواقع |
|----------|--------|
| 6 عمليات في `inspection-workflow.ts` | الكود يضيف **`updateReportItemAction`** لتعديل بند تقرير — يُحدَّث الجدول في نفس الملف بالوثائق. |
| `POST /api/v1/inspection-requests` (مستقبل) | **جزء منه منفَّذ كنمط مختلف:** **`POST /api/gateway`** يتحقق من `X-Dasm-Api-Key` وBearer مستخدم ثم يُنشئ `submitted` + سجل تاريخ؛ ليس مسار REST v1 الموثَّق بالحرف ولكن يغطي التكامل. |

---

## فجوات واضحة لإغلاقها لاحقاً (مرتبة بالأولوية المنطقية)

1. ~~**إلغاء الطلب `cancelled`:**~~ **`cancelInspectionRequestAction`** + زر في `RequestWorkflowPanel` (مع قيود الحالة).
2. ~~**رفع المرفقات + Storage:**~~ **`uploadInspectionAttachmentAction`** + عرض بروابط موقّعة؛ هجرة دلو `inspection-attachments` في `supabase/migrations/`.
3. **ربط JWT إنفاذ بالـ Actions:** عند تشغيل `DASM_JWT_ENFORCE=true`، يُستدعى **`assertInspectionMutationAllowed`** في الإجراءات المتحوّلة (إلغاء، رفع، إلخ).
4. **RLS حقيقية** على الإنتاج: استبدال سياسات `true` بتصميم `rls-policies.md` عبر خطّة rollout.
5. ~~**صفحة `/my-inspections`:**~~ مضافة محلياً + كوكي من **`GET /api/gateway`** + ربط نموذج الطلب بـ `dasm_user_id` عند الدخول من البوابة.
6. **توحيد اسم API:** قرار بين توسعة `POST /api/gateway` أو إضافة `POST /api/v1/inspection-requests` كما في العقد لتقليل اللبس.

---

## الخلاصة

**التنفيذ الحالي يتجاوز «مسودة Figma فقط» بكثير:** مسار الطلب الكامل من `submitted` حتى اعتماد/رفض التقرير يعمل عبر Server Actions، و`/api/gateway` يوفّر دخولاً من المنصّة بالمفتاح. **ما ينقص لإغلاق V1 بالمعنى الكامل للوثائق:** RLS/JWT بحماية إنتاجية كاملة، فرز/لوحات حسب الدور، وتحسينات Phase 4 (rate limit، سياسات Storage، runbook).
