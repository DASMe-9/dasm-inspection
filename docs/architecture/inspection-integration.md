# DASM-e | ربط تقرير الفحص بصفحة تفاصيل السيارة

**الإصدار:** 2.0 (محدّث بعد فحص البنية الفعلية في Supabase)
**التاريخ:** مايو 2026
**النطاق:** ربط مشروع الفحص الورشي (DASM-services) بواجهة DASM-Platform (DASM-core)
**المؤلف:** فريق DASM-e التقني

---

## 1. السياق والواقع الراهن

DASM-e موزّعة على **مشروعَي Supabase منفصلين**:

| المشروع | المعرّف | الدور |
|---|---|---|
| **DASM-core** | `ttkhiatwayvlfksvehzm` | منصة DASM-Platform الرئيسية، السيارات (`Car` model)، المستخدمون، نظام المزادات الرباعي |
| **DASM-services** | `bmfqfmsxtotdksvcqfrh` | الخدمات: الفحص، الشحن، المتاجر، نالب (NALP)، السوق المبوّب (Souq/Marketplace) |

**الربط بين المشروعين**: loose coupling عبر معرّفات نصية لا foreign keys (`dasm_car_id`, `dasm_user_id`, `external_listable_id`). هذا تصميم سليم لا يجب تغييره.

---

## 2. البنية الموجودة في DASM-services (مكتشفة، لا تُعاد)

### 2.1 جداول الفحص (جاهزة ومستخدمة)

```
inspection_workshops      (UUID PK, dasm_partner_ref, slug, ...)
inspection_inspectors     (UUID PK, workshop_id, dasm_user_id, ...)
inspection_requests       (UUID PK, dasm_car_id, dasm_user_id, status enum, service_mode, report_id, ...)
inspection_reports        (UUID PK, request_id, overall_summary, approved_at, ...)  ← الجدول المراد تمديده
inspection_report_items   (UUID PK, report_id, section, label, status, sort_order)
inspection_attachments    (UUID PK, request_id, report_id, file_name, storage_path)
inspection_status_history (UUID PK, request_id, status, actor_role, ...)
inspection_service_pricing, inspection_workshop_applications,
inspection_workshop_reviews, inspection_workshop_follows,
inspection_notifications, inspection_workshop_service_areas
```

### 2.2 جداول السوق (Souq / المبوّب)

```
marketplace_listings           (UUID PK, external_listable_id BIGINT [→ DASM-core.cars.id],
                                listing_mode enum [direct_sale|auction|wanted],
                                vehicle_details JSONB, ...)
marketplace_inspection_reports (UUID PK, listing_id, external_request_id, report_url, ...)
                                ⚠️ external_request_id نوعه BIGINT بينما inspection_requests.id نوعه UUID
marketplace_views, marketplace_favorites, marketplace_shipping_orders
```

### 2.3 ملاحظة مهمة عن العلاقة بين المزاد والإعلان المبوّب

`marketplace_listings.listing_mode` يحوي القيم `direct_sale | auction | wanted`. هذا يعني:
- **الإعلان المبوّب (Souq)** = `listing_mode = 'direct_sale'`
- **المزاد** = `listing_mode = 'auction'`
- **مطلوب (Wanted)** = `listing_mode = 'wanted'`

**النتيجة المعمارية**: تقرير الفحص يعرض في صفحة واحدة (`/listings/[id]`) بنفس Component، بغضّ النظر عن نوع الـ listing.

---

## 3. الفجوة بين البنية الحالية والتقرير المستهدف

`inspection_reports` الحالي بسيط جداً (`overall_summary` نصي فقط) ولا يكفي لاحتواء التقرير المتكامل الذي يتطلب 3 طبقات JSON (MVPI / Workshop / History).

### 3.1 الأعمدة الجديدة المطلوبة في `inspection_reports`

```sql
ALTER TABLE public.inspection_reports
  ADD COLUMN mvpi_layer        JSONB,
  ADD COLUMN workshop_layer    JSONB,
  ADD COLUMN history_layer     JSONB,
  ADD COLUMN final_score       NUMERIC(5,2),
  ADD COLUMN letter_grade      TEXT CHECK (letter_grade IN ('A','B','C','D','F')),
  ADD COLUMN auction_track     TEXT CHECK (auction_track IN ('haraj_live','instant','delayed','fixed','rejected')),
  ADD COLUMN total_repair_cost NUMERIC(10,2),
  ADD COLUMN verification_hash TEXT,
  ADD COLUMN published_at      TIMESTAMPTZ;

CREATE EXTENSION IF NOT EXISTS pg_jsonschema;
```

### 3.2 قرار حول `inspection_report_items`

البنية الحالية تخزّن البنود الفردية. مع JSONB Layers، **نبقي الجدول كما هو** ونستخدمه لـ:
- استعلامات الفلترة السريعة
- عرض ملخص البنود بدون تحميل JSONB كامل

JSONB في `inspection_reports` تكون الـ **source of truth الكاملة**؛ `inspection_report_items` يعمل كـ **indexed view**.

### 3.3 إصلاح `marketplace_inspection_reports`

العمود `external_request_id` نوعه `bigint` لكن `inspection_requests.id` نوعه `uuid`.

```sql
ALTER TABLE public.marketplace_inspection_reports
  ADD COLUMN inspection_request_id UUID,
  ADD COLUMN inspection_report_id  UUID;

ALTER TABLE public.marketplace_inspection_reports
  ADD CONSTRAINT marketplace_inspection_reports_request_fkey
    FOREIGN KEY (inspection_request_id) REFERENCES public.inspection_requests(id) ON DELETE SET NULL,
  ADD CONSTRAINT marketplace_inspection_reports_report_fkey
    FOREIGN KEY (inspection_report_id) REFERENCES public.inspection_reports(id) ON DELETE SET NULL;
```

---

## 4. تدفق البيانات (Data Flow)

```
DASM-core (DASM-Platform)              DASM-services
- Car records (bigint id)              - inspection_requests (dasm_car_id text)
- User records (bigint id)             - inspection_reports (JSONB Layers)
- Auction logic                        - marketplace_listings
       │                                       ↑
       │ loose coupling                        │
       └───────────────────────────────────────┘
                       │
                       ▼
        DASM-Platform Front-end (Next.js)
        - Supabase Client لـ DASM-core
        - Supabase Client لـ DASM-services
        - <InspectionReportTabs />
          (Tabs ويب + Print CSS للـ PDF)
```

---

## 5. خطة التنفيذ — مرحلتان

### المرحلة 1: تمديد قاعدة البيانات في DASM-services
**الفرع:** `feat/inspection-reports-jsonb-layers`

1. Migration: إضافة JSONB layers إلى `inspection_reports`
2. Migration: إصلاح `marketplace_inspection_reports`
3. تثبيت `pg_jsonschema` extension
4. إنشاء View `v_inspection_report_for_listing`
5. RLS policies للقراءة العامة من View
6. توليد TypeScript types من Supabase CLI
7. PR إلى master

### المرحلة 2: Component عرض التقرير
**الفرع:** `feat/inspection-report-component`
راجع `cursor_prompt.md` للخطوات التفصيلية.

---

## 6. قائمة تنبيهات يجب على محمد مراجعتها

| # | التنبيه | الأولوية |
|---|---|---|
| 1 | **RLS معطّل** على `souq_conversations` و `souq_messages` (ثغرة خصوصية) | 🔴 حرج |
| 2 | `marketplace_inspection_reports.external_request_id` نوعه bigint بدلاً من uuid | 🟡 هام |
| 3 | تأكيد: نمدّد `inspection_reports` بـ JSONB، لا ننشئ جدول جديد | ⚪ قرار |
| 4 | نبقي `inspection_report_items` للفلترة السريعة | ⚪ قرار |
| 5 | تأكيد ربط `marketplace_listings.external_listable_id` بـ `Car` في DASM-core | ⚪ تأكيد |

---

## 7. لاحقاً

- ربط Absher API لتزويد `history_layer` تلقائياً
- نظام مقارنة الإصدارات
- Realtime تحديث الـ Tab
- Dashboard لمراقبة جودة التقارير
