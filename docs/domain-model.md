# Domain Model — DASM Inspection

**الغرض:** نموذج مجال **فحص الورش فقط**، طبيعي (normalized)، مع مفاتيح أجنبية وفهارس وتصميم وصول صفّي (RLS) مستهدف.

---

## 1. كيانات النطاق المعتمدة

| كيان منطقي | جدول Postgres | ملاحظات |
|-------------|---------------|---------|
| workshops | `inspection_workshops` | شريك ورشة؛ `dasm_partner_ref` اختياري |
| inspectors | `inspection_inspectors` | يرتبط بورشة اختيارياً؛ `dasm_user_id` |
| inspection_requests | `inspection_requests` | `dasm_car_id` إلزامي؛ حالة سير العمل |
| inspection_reports | `inspection_reports` | واحد لكل طلب (`UNIQUE(request_id)`) |
| report_items | `inspection_report_items` | بنود التقرير |
| attachments | `inspection_attachments` | `storage_path` لربط Storage |
| status_history | `inspection_status_history` | سجل انتقالات الحالة + `actor_role` |

**خارج النطاق:** checklists كجدول مستقل (غير موجود في V1)؛ أي توسعة تتطلب قرار معماري.

---

## 2. العلاقات (Foreign keys)

```
inspection_workshops (1) ──< (N) inspection_inspectors
inspection_workshops (1) ──< (N) inspection_requests [workshop_id]
inspection_inspectors (1) ──< (N) inspection_requests [inspector_id]

inspection_requests (1) ──< (1) inspection_reports [request_id UNIQUE]
inspection_requests (1) ──< (N) inspection_attachments
inspection_requests (1) ──< (N) inspection_status_history

inspection_reports (1) ──< (N) inspection_report_items
inspection_reports (1) ──< (N) inspection_attachments [optional report_id]

inspection_requests.report_id → inspection_reports.id (nullable حتى إنشاء التقرير)
```

**قواعد:**

- حذف طلب: `CASCADE` على التقرير (عبر FK من التقرير إلى الطلب) والبنود والمرفقات والتاريخ — حسب تعريف الهجرة الحالية.
- فك ارتباط: `inspector_id` / `workshop_id` يمكن أن يكونا `NULL` حسب مرحلة الطلب.

---

## 3. أنواع التعداد (Enums)

### `inspection_request_status`

| القيمة | معنى منتجي |
|--------|-------------|
| `draft` | مسودة طلب |
| `submitted` | مُنشأ / مُرسل للمعالجة |
| `assigned` | مُسند لورشة ومفتش |
| `in_progress` | جاري الفحص |
| `pending_review` | تقرير مُقدَّم للمراجعة |
| `approved` | اعتماد نهائي للتقرير |
| `rejected` | رفض المراجعة |
| `cancelled` | إلغاء الطلب |

**Draft Report:** لا يوجد عمود منفصل؛ يُمثَّل بعمل المفتش أثناء `in_progress` حتى استدعاء «تقديم للمراجعة».

### `inspection_report_item_status`

`pass` | `warn` | `fail` | `na`

### `inspection_app_role`

**القيم الكاملة بعد Phase 2:** `super_admin` | `inspection_admin` | `workshop_manager` | `workshop_owner` | `mechanic` | `inspector` | `viewer` | `dasm_user`

**محاذاة DASM ↔ enum:** [`permissions-matrix.md`](./permissions-matrix.md) و [`enum-alignment-strategy.md`](./enum-alignment-strategy.md). الهجرة: `20260404220000_phase2_inspection_app_role_extend.sql`.

---

## 4. الفهارس (Indexes)

| الفهرس | الجدول | الغرض |
|--------|--------|--------|
| `idx_inspection_requests_status` | requests | تصفية لوحات حسب الحالة |
| `idx_inspection_requests_workshop` | requests | عرض طلبات الورشة |
| `idx_inspection_reports_request` | reports | join طلب ↔ تقرير |
| `idx_inspection_history_request` | status_history | خط زمني لكل طلب |

**مقترح لاحقاً (Phase 3+):** `(inspector_id, status)`، `(dasm_user_id)` عند إضافة عمود فهرسة صريح للعميل إن لزم.

---

## 5. تصميم Row Level Security (مستهدف إنتاج)

**الوضع الحالي:** سياسات `authenticated` + `USING (true)` — مناسبة للتطوير مع service role الذي يتجاوز RLS.

**الهدف:**

| الجدول | سياسة مقترحة (مختصرة) |
|--------|-------------------------|
| `inspection_requests` | العميل يرى `dasm_user_id = current_dasm_user()`؛ الورشة ترى `workshop_id` المملوكة؛ المفتش يرى `inspector_id` المطابق؛ المشرف يرى الكل |
| `inspection_reports` | عبر join إلى طلب يمر بنفس قاعدة الطلب |
| `inspection_report_items` | عبر `report_id` → تقرير → طلب |
| `inspection_attachments` | عبر `request_id` |
| `inspection_status_history` | عبر `request_id` |
| `inspection_workshops` | المالك يرى صفه؛ المشرف يرى الكل |
| `inspection_inspectors` | الورشة ترى مفتشيها؛ المفتش يرى نفسه |

التفصيل الكامل لسياسات RLS: [`rls-policies.md`](./rls-policies.md). التكامل مع JWT: [`identity-integration.md`](./identity-integration.md). التفعيل على الإنتاج يبقى في **Phase 2b / 3** بعد تثبيت التوكن واختبار staging.

---

## 6. Storage

- حاوية مرفقات مخصصة (مثلاً `inspection-attachments`)؛ مسارات لا تكشف `user_id` في URL العام.
- سياسات Storage متماثلة مع RLS للطلبات (قراءة فقط لمن يحق له رؤية الطلب).

---

## 7. مراجع الكود

- مخطط الهجرة: `supabase/migrations/20260404120000_inspection_v1_core.sql`
- أنواع TypeScript: `frontend/src/types/index.ts`
- تحويل الصفوف: `frontend/src/lib/data/mappers.ts`
