# Permissions Matrix — DASM Inspection

**الهدف:** كل دور يرى **فقط** ما يخصه بعد تفعيل RLS + middleware.  
**الحالة:** التطبيق الحالي يستخدم **service role** على الخادم (تجاوز RLS) — هذا الجدول يصف **الهدف الإنتاجي** و**الفجوة**.

---

## 1. الأدوار المعتمدة (Master prompt)

| الدور | الوصف المختصر |
|--------|----------------|
| `inspection_admin` | إدارة كاملة لمجال الفحص عبر الواجهة |
| `workshop_owner` | مالك/مدير ورشة معتمدة |
| `mechanic` | فني في الورشة (قد يُقيَّد عن المفتش لاحقاً) |
| `inspector` | منفّذ الفحص المسند |
| `dasm_user` | عميل/مستخدم منصة DASM مرتبط بطلب فحص |

---

## 2. الحالة الحالية في قاعدة البيانات (`inspection_app_role`)

| قيمة DB الحالية | ملاحظات |
|-------------------|---------|
| `super_admin` | صلاحيات واسعة؛ يُنصح بالحصر على تشغيل المنصة |
| `inspection_admin` | يطابق المعتمد |
| `workshop_manager` | **أقرب** لـ `workshop_owner` |
| `inspector` | يطابق المعتمد |
| `viewer` | **أقرب** لقراءة `dasm_user` أو مراقب |

**الفجوة:** لا يوجد `workshop_owner` ولا `mechanic` ولا `dasm_user` كقيم enum حالياً.

**Phase 2 (مقترح):** إما إضافة قيم جديدة للـ enum مع ترحيل بيانات، أو جدول تعيين `dasm_role` → `inspection_app_role` دون كسر الصفوف الموجودة في `inspection_status_history`.

---

## 3. مصفوفة الوصول (CRUD مبسّط)

رمز: **C** إنشاء، **R** قراءة، **U** تحديث، **D** حذف، **—** ممنوع، **R\*** قراءة مفلترة.

### inspection_requests

| الدور | C | R | U | D | ملاحظات |
|-------|---|---|---|---|---------|
| inspection_admin | ✓ | ✓ الكل | ✓ | محدود | إلغاء مسموح بسياسة منتج |
| workshop_owner | — | R\* | U\* | — | R\*/U\* لطلبات `workshop_id` المملوكة |
| mechanic | — | R\* | — | — | إن وُجد دور منفصل عن المفتش |
| inspector | — | R\* | U\* | — | طلبات `inspector_id` = هو |
| dasm_user | — | R\* | — | — | طلبات `dasm_user_id` = هو |

### inspection_reports / inspection_report_items

نفس منطق الطلب عبر `request_id` / `report_id`.

### inspection_attachments

قراءة/رفع حسب من يملك رؤية الطلب؛ حذف عادة `inspection_admin` فقط.

### inspection_workshops / inspection_inspectors

| الدور | workshops | inspectors |
|--------|-----------|------------|
| inspection_admin | CRUD | CRUD |
| workshop_owner | R/U لورشته | R لورشته؛ ربما U محدود |
| inspector | R (ورشته) | R (نفسه) |
| dasm_user | — | — |

### inspection_status_history

| الدور | R | إدراج |
|--------|---|--------|
| الكل (ذوو رؤية الطلب) | R للطلب المسموح | إدراج عبر Server Actions فقط (خادم) |

---

## 4. سياسات تكميلية

- **منع تسريب القوائم:** لا `SELECT *` بدون فلتر دور في واجهات الإنتاج.
- **Service role:** يبقى لمهام إدارية خلفية فقط؛ لا يُعرَّض للمتصفح.
- **تدقيق:** تسجيل `actor_role` في `inspection_status_history` عند كل انتقال حالة.

---

## 5. اختبار القبول (قبل الدمج لاحقاً)

- [ ] مستخدم بدون صلاحية لا يرى طلبات الآخرين (استعلام مباشر بـ anon + JWT).
- [ ] مفتش لا يعدّل طلباً غير مسند له.
- [ ] عميل لا يرى تقريراً قبل سياسة العرض المتفق عليها.
- [ ] لا مسارات أو حقول شحن في الاستجابات.
