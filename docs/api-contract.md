# API Contract — DASM Inspection

**الحالة:** Phase 1 — عقد **مرجعي**؛ التنفيذ الحالي يعتمد Server Actions؛ واجهات HTTP الخارجية تُفعَّل عند ربط DASM.

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
| `assignInspectionRequestAction` | requestId, workshopId, inspectorId |同上 | من `submitted` فقط |
| `startInspectionAction` | requestId |同上 | من `assigned` |
| `submitReportForReviewAction` | requestId |同上 | ينشئ تقريراً + بنوداً افتراضية؛ `pending_review` |
| `approveReportAction` | requestId |同上 | من `pending_review` |
| `rejectReportAction` | requestId, reason |同上 | من `pending_review` |
| `updateReportItemAction` | itemId, status, notes? |同上 | تحديث بند (`pass`/`warn`/`fail`/`na`) في `inspection_report_items` |
| `cancelInspectionRequestAction` | requestId, reason? |同上 | من `submitted` / `assigned` / `in_progress` فقط؛ يرفض إن وُجد `report_id` |
| `uploadInspectionAttachmentAction` | requestId, `FormData` بمفتاح `file` |同上 | رفع إلى حاوية Storage (اسم الدلو من `INSPECTION_ATTACHMENTS_BUCKET`، افتراضياً `inspection-attachments`) ثم إدراج `inspection_attachments` |

**العقد الضمني:** `ActionResult = { ok: true } | { ok: false; message: string }`.

**ملاحظات:** عرض المرفقات للمستخدم يتم عبر **روابط موقّعة** تولَّد في طبقة البيانات (`getAttachmentsWithSignedUrls`) — لا تُعرَض مسارات التخزين الخام.

---

## 2.1 بوابة DASM المنفَّذة (Route Handler — ليس نفس مسار REST v1)

| الملف | الطرق | الغرض |
|-------|-------|-------|
| `frontend/src/app/api/gateway/route.ts` | **GET** | `?token=` مستخدم DASM → تحقق عبر `{DASM_API_URL}/api/user/profile` → إعادة توجيه إلى `/requests` مع query params + **كوكي httpOnly** `inspection_dasm_user_id` لتصفية **صفحة `/my-inspections`** |
| نفس الملف | **POST** | `X-Dasm-Api-Key` (قائمة `DASM_GATEWAY_API_KEYS`) + `Authorization: Bearer` مستخدم؛ body `dasm_car_id`, `vehicle_label`, اختياري `title`, `auction_reference` → إدراج طلب `submitted` |

يُكمِّل جزءاً من نية **`POST /api/v1/inspection-requests`** المقترجة أعلاه بتوقيع مختلف (مفتاح خدمة + توكن مستخدم).

---

## 3. واجهات HTTP مقترحة (مستقبل — DASM → Inspection)

لا تُنشر في الإنتاج دون **Phase 2+** وبوابة API (Edge / Route Handler) وتحقق JWT.

### 3.1 إنشاء طلب فحص (من المنصة)

`POST /api/v1/inspection-requests`  
**Headers:** `Authorization: Bearer <dasm_jwt>`

**Body (مثال):**

```json
{
  "dasm_car_id": "string",
  "vehicle_label": "string",
  "title": "string",
  "dasm_user_id": "string | null",
  "auction_reference": "string | null"
}
```

**201:** `{ "id": "uuid", "status": "submitted" }`  
**4xx:** `{ "error": "code", "message": "string" }`

### 3.2 جلب طلب (للعميل أو الورشة حسب الصلاحية)

`GET /api/v1/inspection-requests/:id`

**200:** نفس شكل `InspectionRequest` + روابط تقرير/مرفقات حسب الصلاحية.

### 3.3 Webhook (اختياري)

`POST /api/v1/webhooks/dasm` — أحداث من المنصة (مثلاً إلغاء مزاد) لتحديث `cancelled` أو تعليق؛ **يتطلب** توقيع سرّي مشترك.

---

## 4. أحداث مجال (Domain events) — اختياري لاحقاً

للتكامل غير المتزامن: `InspectionRequestSubmitted`, `ReportApproved`, `ReportRejected` — يمكن نشرها إلى طابور (Outbox) دون توسيع النطاق في Phase 1.

---

## 5. ما هو خارج العقد

- شحن، تتبع، ناقل، تسليم بضائع.
- مصادقة مستخدمين محلية (signup/login).
- نسخ منطق مزاد أو محفظة من DASM.
