# API Contract — DASM Inspection

**الحالة:** Phase 2 جزئياً — Server Actions للسير الداخلي؛ **بوابة DASM + REST v1** للإنشاء والقراءة المملوكة؛ webhook وباقي التوسعة لاحقاً.

---

## 1. مبادئ

- **لا تكرار منطق المنصة الأم:** المركبة والمستخدم الأساسيان في DASM؛ هنا **مراجع** فقط (`dasm_car_id`, `dasm_user_id`).
- **مصادقة:** جميع نقاط الحماية تفترض توكناً صادراً عن **DASM** (أو بوابة موحدة) ما عدا مسارات صحة عامة مقصودة — التفصيل في [`identity-integration.md`](./identity-integration.md).
- **تنسيق:** JSON، UTF-8، أوقات ISO-8601.

---

## 2. واجهة داخلية حالية (Next.js Server Actions)

الملف: `frontend/src/app/actions/inspection-workflow.ts`

| العملية | مدخلات (مختصر) | مخرجات | ملاحظات |
|---------|----------------|--------|---------|
| `createInspectionRequestAction` | `FormData`: title, dasm_car_id, vehicle_label, … | `{ ok, message? }` | ينشئ طلباً `submitted` + سجل تاريخ |
| `assignInspectionRequestAction` | requestId, workshopId, inspectorId, `{ serviceMode?, fieldServiceAddress? }` |同上 | من `submitted`؛ يضبط `service_mode` و`quoted_fee_sar` |
| `dispatchInspectionAction` | requestId |同上 | فحص ميداني: `assigned` → `dispatched` |
| `confirmOnSiteAction` | requestId |同上 | فحص ميداني: `dispatched` → `on_site` |
| `startInspectionAction` | requestId |同上 | ورشة: من `assigned`؛ ميداني: من `on_site` |
| `submitReportForReviewAction` | requestId |同上 | ينشئ تقريراً + بنوداً افتراضية؛ `pending_review` |
| `approveReportAction` | requestId |同上 | من `pending_review` |
| `rejectReportAction` | requestId, reason |同上 | من `pending_review` |
| `updateReportItemAction` | itemId, status, notes? |同上 | تحديث بند (`pass`/`warn`/`fail`/`na`) في `inspection_report_items` |
| `cancelInspectionRequestAction` | requestId, reason? |同上 | من `submitted` / `assigned` / `in_progress` فقط؛ يرفض إن وُجد `report_id` |
| `uploadInspectionAttachmentAction` | requestId, `FormData` بمفتاح `file` |同上 | رفع إلى حاوية Storage (اسم الدلو من `INSPECTION_ATTACHMENTS_BUCKET`، افتراضياً `inspection-attachments`) ثم إدراج `inspection_attachments` |
| `setRepairQuoteAction` | requestId, `repairQuoteSar` (أو `null` للإزالة), `repairQuoteNotes?` |同上 | من `in_progress` / `pending_review` / `approved`؛ يحدّث `repair_quote_*` منفصلة عن `quoted_fee_sar` |

**العقد الضمني:** `ActionResult = { ok: true } | { ok: false; message: string }`.

**ملاحظات:** عرض المرفقات للمستخدم يتم عبر **روابط موقّعة** تولَّد في طبقة البيانات (`getAttachmentsWithSignedUrls`) — لا تُعرَض مسارات التخزين الخام.

---

## 2.1 بوابة DASM و REST v1 — المنفَّذ

المكتبة المشتركة للمصادقة والتحقق من مستخدم المنصّة: `frontend/src/lib/api/inspection-http-auth.ts`  
إدراج الطلب المشترك: `frontend/src/lib/api/inspection-request-http.ts`  
تحديد معدّل الإنشاء (نافذة دقيقة؛ بصمة مفتاح + IP): `frontend/src/lib/api/inspection-create-rate-limit.ts` — المتغير `INSPECTION_CREATE_RATE_LIMIT_PER_MIN` (افتراضي **60**؛ **≤0** يعطّل)

| الملف | الطرق | الغرض |
|-------|-------|-------|
| `frontend/src/app/api/gateway/route.ts` | **GET** | `?token=` مستخدم DASM → `verifyDasmUserToken` (نفس نقطة `{DASM_API_URL}/api/user/profile`) → إعادة توجيه إلى `/requests` مع query params + **كوكي httpOnly** `inspection_dasm_user_id` لتصفية **صفحة `/my-inspections`** |
| نفس الملف | **POST** | حدّ معدّل الإنشاء ثم المصادقة؛ كما أعلاه؛ **429** عند التجاوز ورأس **`Retry-After`** |
| `frontend/src/app/api/v1/inspection-requests/route.ts` | **POST** | حدّ معدّل الإنشاء ثم نفس المصادقة والجسم؛ استجابة **201** JSON حسب §3.1؛ **429** عند التجاوز |
| `frontend/src/app/api/v1/inspection-requests/[id]/route.ts` | **GET** | مفتاح خدمة + Bearer؛ **404** إن لم يكن الطلب للمستخدم |
| `frontend/src/app/api/auth/sso-callback/route.ts` | **POST** | `{ sso_token }` → `{DASM_API_URL}/api/sso/verify` مع `platform: inspection` → `access_token` + `user` + كوكي httpOnly `inspection_dasm_user_id` / `inspection_ui_role` |

### 2.2 SSO من المنصّة الأم (`/auth/callback`)

**التدفق:** `dasm.com.sa` (مثلاً `/dashboard/technical-inspection`) → `POST /api/sso/generate` → فتح:

`https://inspect.dasm.com.sa/auth/callback?sso_token=…&return_url=…&redirect=…`

| الخطوة | المكوّن |
|--------|---------|
| 1 | `auth/callback/page.tsx` يقرأ `sso_token` و`redirect` |
| 2 | `POST /api/auth/sso-callback` يستهلك التوكن على Core ويضبط كوكي البوابة |
| 3 | العميل يضبط `dasm_access_token` + `inspection_token` + `localStorage.inspection_user` (كما `/auth/login`) |
| 4 | إعادة توجيه: `redirect` بعد تعيين مسارات المنصّة (`/request` → `/requests`، `/tracking?id=` → `/track/{id}`)؛ مستخدم `dasm_user` يُوجَّه مع `gateway=dasm` |

**مسار قديم (ما زال مدعوماً):** `GET /api/gateway?token=` — Sanctum مباشر بدون SSO.

يُفضّل للتكامل الجديد استخدام **`POST /api/v1/inspection-requests`** بدل **`POST /api/gateway`** (المساران متكافئان منطقياً).

---

## 3. واجهات HTTP REST v1 (DASM ↔ Inspection)

**المصادقة على الإنشاء والقراءة:** **`X-Dasm-Api-Key`** (أو `Authorization: ApiKey …`) مع **`Authorization: Bearer <توكن مستخدم المنصّة>`**.

**لا يُقبل `dasm_user_id` في الجسم لانتحال الهوية:** المالك يُستنتج من توكن المنصّة.

### 3.1 إنشاء طلب فحص

`POST /api/v1/inspection-requests`

**Body:**

```json
{
  "dasm_car_id": "string",
  "vehicle_label": "string",
  "title": "string",
  "auction_reference": "string | null"
}
```

**201:**

```json
{
  "id": "uuid",
  "status": "submitted",
  "title": "string",
  "vehicle_label": "string",
  "tracking_url": "https://…/requests/{id}"
}
```

**4xx:** `{ "error": "code", "message": "string" }`

**429 (تجاوز الحد):** `{ "error": "rate_limited", "message": "…", "retry_after": number }` ورأس **`Retry-After`** (ثوانٍ). ينطبق نفس الحدّ على **`POST /api/gateway`** مع شكل `{ "success": false, "message": "…" }`.

**التنفيذ:** `frontend/src/app/api/v1/inspection-requests/route.ts`.

### 3.2 أسعار الفحص (ورشة / ميداني)

`GET /api/v1/service-pricing`

**Query (اختياري):** `workshop_id` — أسعار فعّالة لورشة واحدة (مع fallback للمنصّة).

**200:**

```json
{
  "currency_default": "SAR",
  "platform": { "workshop_sar": 350, "field_sar": 550 },
  "workshops": [
    {
      "workshop_id": "uuid",
      "workshop_sar": 320,
      "field_sar": 520,
      "currency": "SAR"
    }
  ]
}
```

**مصدر البيانات:** جدول Supabase `inspection_service_pricing` (`workshop_id` فارغ = افتراضي المنصّة).

**التنفيذ:** `frontend/src/app/api/v1/service-pricing/route.ts`.

### 3.3 جلب طلب (مالك المنصّة)

`GET /api/v1/inspection-requests/:id`

**200:** حقول الطلب من الجدول (`id`, `title`, `status`, `dasm_car_id`, `vehicle_label`, `quoted_fee_sar`, `repair_quote_sar`, `repair_quote_notes`, `repair_quote_offered_at`, …) إذا كان **`dasm_user_id`** للطلب يطابق مستخدم Bearer.

**ملاحظة:** `quoted_fee_sar` = رسوم خدمة الفحص عند الإسناد؛ `repair_quote_sar` = عرض إصلاح اختياري منفصل يُسجّله الطاقم بعد بدء الفحص.

**404:** الطلب غير موجود أو لا يخصّ المستخدم.

**التنفيذ:** `frontend/src/app/api/v1/inspection-requests/[id]/route.ts`.

### 3.3 مسار البوابة (استمرارية)

| الملف | الطرق | الغرض |
|-------|-------|-------|
| `frontend/src/app/api/gateway/route.ts` | **POST** | نفس المنطق + حدّ المعدّل؛ استجابة `{ success, data, message }` أو **429** |

### 3.5 ربط التقرير المعتمد بسيارة Core (منفّذ — 2026-05-21)

عند **اعتماد التقرير** في Inspection، الخادم يستدعي (إن وُجد `dasm_car_id`):

`POST {DASM_CORE_API_URL}/api/internal/dasm-inspection/reports/sync`

**Headers:** `X-DASM-Internal-Token: {DASM_INSPECTION_INTERNAL_PULL_TOKEN}`

**Body:** انظر `DASM-Platform` → `docs/features/INSPECTION_PLATFORM_MASTER_PLAN.md` §6 (عقد sync).

**Idempotency:** `inspection_report_id` فريد على Core.

### 3.5 Webhook من المنصّة (اختياري — لم يُنفَّذ)

`POST /api/v1/webhooks/dasm` — أحداث من المنصّة إلى Inspection؛ **يتطلب** توقيع سرّي مشترك.

---

## 4. أحداث مجال (Domain events) — اختياري لاحقاً

للتكامل غير المتزامن: `InspectionRequestSubmitted`, `ReportApproved`, `ReportRejected` — يمكن نشرها إلى طابور (Outbox) دون توسيع النطاق في Phase 1.

---

## 4.1 سياسة العرض العام (معتمد فقط)

- **Core:** لا يُعرض تقرير ورشة على `carDetails` أو شارات القوائم إلا إذا وُجد `approved_at` على سجل `car_inspection_reports`.
- **sync:** `approved_at` **مطلوب** في `POST …/reports/sync`.
- **تتبع العميل** (`/track/{id}`): ملخص التقرير يُحمَّل ويُعرض فقط عندما `inspection_requests.status === approved`.

## 4.2 جسر Core — سيارة minimal + sync تقرير

| Endpoint Core | متى يُستدعى من Inspection |
|---------------|---------------------------|
| `POST /api/internal/dasm-inspection/cars/minimal` | إنشاء طلب بدون `dasm_car_id` (مع `dasm_user_id`)؛ أو عند الاعتماد إن بقي المعرّف غير رقمي |
| `POST /api/internal/dasm-inspection/reports/sync` | بعد `approveReportAction` عند توفر `car_id` |

**Headers:** `X-DASM-Internal-Token: DASM_INSPECTION_INTERNAL_PULL_TOKEN`  
**Env:** `DASM_CORE_API_URL`, `DASM_INSPECTION_SYNC_ENABLED` (افتراضي مفعّل)

---

## 5. ما هو خارج العقد

- شحن، تتبع، ناقل، تسليم بضائع.
- مصادقة مستخدمين محلية (signup/login).
- نسخ منطق مزاد أو محفظة من DASM.
