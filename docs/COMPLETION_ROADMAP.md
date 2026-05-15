# خطة إكمال مشروع الفحص — مسار واضح (`dasm-inspection`)

**الهدف:** لا تضيع الأولويات؛ كل مرحلة لها مدخل ومخرج يمكن التحقق منه.

**مرجع الحالة التفصيلية:** [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md)

---

## المرحلة 0 — ما هو «جاهز للمنتج الوظيفي» اليوم

| البند | الحالة |
|-------|--------|
| مسارات V1 الرئيسية + سير عمل الطلب حتى اعتماد/رفض | ✅ |
| البوابة `GET/POST /api/gateway`، **REST v1** `POST/GET /api/v1/inspection-requests`، طلباتي، إلغاء، مرفقات + توقيع روابط | ✅ |
| دلو Storage `inspection-attachments` + قفل `storage.objects` للعملاء (RESTRICTIVE) | ✅ يُطبَّق على المشروع عبر الهجرات |

---

## المرحلة 1 — أمان البيانات بدون جسر JWT على Supabase (منطقي الآن)

**المشكلة:** سياسات `FOR ALL TO authenticated USING (true)` تسمح لأي عميل يستخدم **Supabase Auth + anon/publishable** بالقراءة/الكتابة المباشرة على الجداول إن وُجد مسار SDK.

**الحل المتّبع:** هجرة **`rls_deny_authenticated_direct_access`** — رفض صريح لدور `authenticated` على كل جداول `inspection_*`؛ **مسار التطبيق الرسمي يبقى عبر `service_role` على الخادم** (Server Actions الحالية).

| خطوة | مالذي تفعله |
|------|----------------|
| 1.1 | مراجعة ملف الهجرة في `supabase/migrations/` |
| 1.2 | تطبيقها على **staging** أولاً إن وُجد؛ ثم **إنتاج DASM-services** |
| 1.3 | دخّن سريع: إنشاء طلب من الواجهة + إسناد + رفع مرفق |

**✅ إنتاج DASM-services (2026-05-16):** هجرة **`rls_deny_authenticated_direct_access`** مطبَّقة ومؤكَّد وجود سياسات `*_no_direct_authenticated` على الجداول السبعة؛ هجرة **`storage_objects_inspection_attachments_lockdown`** مطبَّقة ومؤكَّد وجود سياسات RESTRICTIVE على **`storage.objects`** لدلو **`inspection-attachments`**. مرجع استعلامات تحقق سريعة: [`RUNBOOK.md`](./RUNBOOK.md).

**ما لم يُغلَق بعد:** سياسات JWT الدقيقة حسب [`rls-policies.md`](./rls-policies.md) تظل **مرحلة لاحقة** عندما يصبح JWT المنصّة متصلًا فعليًا بـ `auth.jwt()` في Postgres.

---

## المرحلة 2 — Storage (كائنات الحاوية)

| خطوة | الملاحظة |
|------|-----------|
| 2.1 | الدلو الخاص موجود؛ الرفع والتحميل عبر الخادم موقّع |
| 2.2 | ✅ **منفَّذ ومطبَّق على إنتاج DASM-services:** هجرة **`storage_objects_inspection_attachments_lockdown`** — سياسات RESTRICTIVE على `storage.objects` لدوري `authenticated` و`anon` على دلو **`inspection-attachments`** (التفصيل في [`rls-policies.md`](./rls-policies.md) §8). |

---

## المرحلة 3 — عقد HTTP والمنتج

| خطوة | القرار المطلوب من المنتج |
|------|---------------------------|
| 3.1 | ✅ **موحَّد في العقد:** **`POST /api/v1/inspection-requests`** + **`GET /api/v1/inspection-requests/:id`** مع **`POST /api/gateway`** للتوافق الخلفي — انظر [`api-contract.md`](./api-contract.md) §2.1 و§3. |

---

## المرحلة 4 — تشغيل ومراقبة

| خطوة | المحتوى |
|------|---------|
| 4.1 | ✅ **حدّ معدّل داخل التطبيق:** `INSPECTION_CREATE_RATE_LIMIT_PER_MIN` على **`POST /api/gateway`** و **`POST /api/v1/inspection-requests`** (انظر [`api-contract.md`](./api-contract.md)). تعزيز اختياري لاحقاً: Edge / Cloudflare / KV موزَّع. |
| 4.2 | ✅ **سجلات + مسار تنبيهات:** سجلات **`inspection_ops`** JSON — [`RUNBOOK.md`](./RUNBOOK.md)؛ دليل Log Drains وقواعد التنبيه: [`INSPECTION_OPS_ALERTING.md`](./INSPECTION_OPS_ALERTING.md). |
| 4.3 | [`RUNBOOK.md`](./RUNBOOK.md) — قائمة تحقق بعد النشر |

---

## المرحلة 5 — تجربة المستخدم (منفصلة تقنيًا)

✅ **دفعة أولى (2026-05-15):** تحسين بطاقات الهيكل الرئيسي، لوحة التحكم، قائمة الطلبات، الاشتراك، الشريط الجانبي — بدون مس الهجرات أو العقد.

✅ **دفعة ورش v2:** صفحة **`/workshops`** كبوّابة شبكة (إحصاءات، بطاقات عصرية، CTAs للطلب والاشتراك) + **`/workshops/:id`** بتجربة تفصيل فخمة للمشتركين والشركاء — بدون مس الهجرات أو العقد.

✅ **دفعة ثانية:** فرز وفلترة حالة الطلب على **`/requests`** و **`/my-inspections`** (معاملات URL `status` و `sort`).

تحسينات إضافية (لوحات حسب الدور، فرز وفلاتر) — **بعد** استقرار المراقبة أو في PRs مستقلة ضيقة النطاق.

---

## المرحلة 6 — لوحات حسب الدور + فلاتر أوسع + مسار تنبيهات

| البند | المخرج |
|-------|--------|
| لوحات حسب الدور | شريط جانبي/سفلي يعتمد على **`inspection_role`** من JWT (`DASM_JWT_ENFORCE`) أو كوكي **`inspection_ui_role`** من GET `/api/gateway` عند إرجاع الحقل من `/api/user/profile`؛ إزالة رؤوس `x-inspection-*` الواردة من العميل في **Middleware** لمنع الانتحال. |
| فلاتر أوسع | استعلام **`workshop`** (UUID) على **`/requests`** و **`/my-inspections`** مع **`RequestListFilters`**. |
| تنبيهات **`inspection_ops`** | [`INSPECTION_OPS_ALERTING.md`](./INSPECTION_OPS_ALERTING.md) |

---

## ترتيب العمل الموصى به (لم تنحرف)

```text
0 تأكيد النشر على inspect.dasm.com.sa يقرأ من master الحديث (بعد دمج PR ورش الواجهة + إعدادات Vercel)
0b مشروع Vercel «dasm-inspection» (فريق dasme-projects): **Root Directory = `frontend`** حتى يُنفَّذ `next build` من مجلد التطبيق ويُكتشف `.next` بشكل صحيح مع Git→Vercel
~~1 تطبيق هجرة RLS الإغلاق + هجرة storage.objects lockdown على DASM-services~~ — ✅ **مطبَّق ومؤكَّد إنتاجياً (2026-05-16)**
2 فحص يدوي للمسار الكامل + مرفق
3 ~~مسار REST v1~~ — منفَّذ ومموَّث في api-contract.md
4 ~~حدّ معدّل الإنشاء في التطبيق~~ — منفَّذ؛ تعزيز موزَّع لاحقاً عند الحاجة
5 ~~تحسينات واجهة إضافية~~ — فرز/فلترة القوائم + فلتر ورشة؛ لوحات تنقل بحسب الدور (JWT أو كوكي البوابة)
```

آخر تحديث للمخطط: **2026-05-15**.
