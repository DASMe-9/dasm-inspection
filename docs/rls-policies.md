# RLS Policy Design — Inspection Domain (Phase 2)

**الحالة:** تصميم **مرجعي** للتطبيق عند تفعيل **JWT/جلسة مستخدم** على Supabase.  
**اليوم:** سياسات `FOR ALL TO authenticated USING (true)` — مناسبة للتطوير فقط؛ **service role** يتجاوز RLS دائماً.

**Hard boundaries:** لا سياسات لشحن أو تسليم أو لوجستيات.

---

## 1. مبادئ

1. **الافتراضي:** رفض ما لم يُصرَّح صراحة.
2. **المفتش / الفني:** يرى الطلبات المرتبطة بـ `inspector_id` أو بورشته حسب المنتج.
3. **مالك الورشة:** يرى `workshop_id` الخاص به فقط.
4. **عميل DASM (`dasm_user`):** يرى الطلبات حيث `dasm_user_id` يطابق مطالبة JWT.
5. **`inspection_admin` / `super_admin`:** رؤية وكتابة كاملة ضمن جداول الفحص (وليس منصة DASM).

---

## 2. دوال مساعدة مقترحة (JWT → سياق)

> **تنبيه:** أسماء الدوال والمسارات تعتمد على كيفية حقن مطالبات JWT في Supabase (مثلاً `auth.jwt()` أو `current_setting`). راجع توثيق إصدار Supabase لديكم واضبط الجسم.

```sql
-- مثال مفاهيمي — لا يُنفَّذ تلقائياً في Phase 2
CREATE OR REPLACE FUNCTION public.inspection_claim_text(p_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> p_key),
    (auth.jwt() -> 'app_metadata' ->> p_key),
    (auth.jwt() -> 'user_metadata' ->> p_key)
  );
$$;

CREATE OR REPLACE FUNCTION public.inspection_current_dasm_user_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    inspection_claim_text('dasm_user_id'),
    inspection_claim_text('sub')
  );
$$;

CREATE OR REPLACE FUNCTION public.inspection_current_inspection_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT inspection_claim_text('inspection_role');
$$;

CREATE OR REPLACE FUNCTION public.inspection_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT inspection_current_inspection_role() IN ('inspection_admin', 'super_admin')
     OR inspection_claim_text('role') = 'service_role'; -- عادة لا يُستخدم مع RLS؛ للتوضيح فقط
$$;
```

في الإنتاج، **لا** تعتمد على `service_role` داخل RLS للمستخدم النهائي.

---

## 3. جدول `inspection_workshops`

| العملية | من يُسمح | شرط |
|---------|-----------|------|
| SELECT | inspection_admin, super_admin | دائماً (ضمن المنتج) |
| SELECT | workshop_owner | `id = workshop_id` من المطالبة |
| SELECT | inspector, mechanic | `id` يساوي `workshop_id` للمفتش/الفني |
| INSERT/UPDATE/DELETE | inspection_admin (و super_admin إن سياسة المنصة تسمح) | — |
| UPDATE | workshop_owner | صف ورشته فقط |

**ممنوع:** dasm_user يقرأ قائمة كل الورش (إلا إن منتجاً آخر يتطلب ذلك صراحة).

---

## 4. جدول `inspection_inspectors`

| العملية | من يُسمح | شرط |
|---------|-----------|------|
| SELECT | admin | الكل |
| SELECT | workshop_owner | `workshop_id` = ورشته |
| SELECT | inspector | صف حيث `dasm_user_id` أو `id` يطابق المطالبة |
| INSERT/UPDATE | admin؛ workshop_owner محدود لورشته | حسب منتجكم |

---

## 5. جدول `inspection_requests`

| العملية | من يُسمح | شرط |
|---------|-----------|------|
| SELECT | admin | true |
| SELECT | workshop_owner | `workshop_id` = مطالبة `workshop_id` |
| SELECT | inspector | `inspector_id` = `inspector_record_id` من JWT |
| SELECT | mechanic | نفس منطق المنتج (مثلاً نفس الورشة بدون تعديل حالة اعتماد) |
| SELECT | dasm_user | `dasm_user_id` = `inspection_current_dasm_user_id()` |
| INSERT | dasm_user (إنشاء طلب)، admin | قواعد منتج DASM |
| UPDATE | admin؛ workshop_owner (إسناد محدود)؛ inspector (حقول التنفيذ) | حسب `status` |
| DELETE | عادة admin فقط أو ممنوع | — |

**اعتماد/رفض التقرير:** يقتصر عادة على `inspection_admin` (ومن يساويه في المطالبة).

---

## 6. جدول `inspection_reports`

الوصول عبر `request_id` المرتبط بطلب يمر بنفس قواعد رؤية الطلب.

| العملية | من يُسمح |
|---------|-----------|
| SELECT | من لهم رؤية الطلب |
| INSERT/UPDATE | inspector أثناء المسار؛ admin دائماً |
| UPDATE `approved_at` / رفض | inspection_admin (أو سير عمل خادم موقّع) |

---

## 7. جدول `inspection_report_items`

| العملية | من يُسمح |
|---------|-----------|
| SELECT | من لهم رؤية التقرير |
| INSERT/UPDATE/DELETE | inspector أثناء `in_progress`؛ admin |

---

## 8. جدول `inspection_attachments`

| العملية | من يُسمح |
|---------|-----------|
| SELECT | من لهم رؤية الطلب/التقرير |
| INSERT | inspector، dasm_user (رفع لطلبه)، admin |
| DELETE | admin؛ صاحب الطلب حسب سياسة المنتج |

**Storage:** سياسات الحاوية يجب أن تعكس نفس منطق `request_id`.

---

## 9. جدول `inspection_status_history`

| العملية | من يُسمح |
|---------|-----------|
| SELECT | من لهم رؤية الطلب المرتبط بـ `request_id` |
| INSERT | **خادم فقط** (service role أو دالة `SECURITY DEFINER` مقيدة)؛ لا إدراج مباشر من العميل لكل المستخدمين |

**سبب:** منع تزوير سجل الحالات؛ الحفاظ على **سلامة التاريخ** كما اشترطت Phase 2.

---

## 10. خطة التفعيل (Rollout)

1. **الوثائق** (Phase 2): اعتماد هذا الملف + `identity-integration.md`.
2. **طبقة التوافق:** تفعيل JWT في Supabase أو التبادل عبر Edge.
3. **إنشاء الدوال المساعدة** في قاعدة بيانات staging.
4. **استبدال سياسات `USING (true)`** جدولاً بجدول على بيئة staging؛ اختبار كل دور.
5. **الإنتاج:** نافذة صيانة أو تفعيل تدريجي؛ **التراجع:** إعادة سياسات التطوير المفتوحة مؤقتاً فقط في حالات الطوارئ (مع تقليل المخاطر).

---

## 11. مراجع

- `identity-integration.md`
- `permissions-matrix.md`
- `enum-alignment-strategy.md`
