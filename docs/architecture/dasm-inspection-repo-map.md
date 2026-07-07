# خريطة ريبو «فحص داسم» (dasm-inspection) — التقرير المعماري الشامل

> وثيقة حيّة. آخر تحديث: 2026-07-07.
> نظيرتها التوضيحية: [`dasm-inspection-repo-map.html`](./dasm-inspection-repo-map.html).
> الغرض: صورة كاملة لكل ما في الريبو وارتباطاته — لإعادة الربط الصحيح ومعرفة «مالنا وما علينا».

---

## 0. الخلاصة التنفيذية (ابدأ من هنا)

- **ما هو:** تطبيق مستقل للفحص الفني للمركبات — واجهة + خلفية في ريبو واحد.
- **التقنية:** Next.js 14.2.35 (App Router) + Supabase (PostgreSQL). النشر على Vercel، النطاق `inspect.dasm.com.sa`.
- **قاعدة البيانات:** مشروع Supabase واحد للفحص = **DASM-services** (`bmfqfmsxtotdksvcqfrh`) يحوي كل جداول `inspection_*`. يشير إلى **DASM-core** (`ttkhiatwayvlfksvehzm`) للمستخدمين والسيارات **بالمرجع فقط** (لا ينسخها).
- **الحجم:** 29 صفحة · 28 نقطة نهاية (API) · ~30 إجراء خادم · 19 جدولاً · 28 هجرة · ~89 ملف بيانات/منطق.
- **الحكم على «التشوّه»:** بنيةً، الريبو **متماسك أكثر مما يبدو**: لا روابط مكسورة، لا مسارات مكرّرة، كل مفاتيح التنقّل لها صفحات. الإحساس بالتشوّه مصدره أربعة أمور عولج أهمها:
  1. **كسر القشرة** (رابط داخل اللوحة يقذف للموقع العام) — **أُصلح** بـ PR #70 (قشرة تكيّفية).
  2. ضعف اكتشاف صفحات التفاصيل (تُفتح من قوائم داخلية لا من التنقّل الرئيسي) — تصميم مقبول.
  3. فجوات الوضع الداكن على لوحة الورشة/تفاصيل الطلب — **متبقٍّ**.
  4. وثائق قديمة/مفقودة تصف حالة سابقة — **متبقٍّ**.
- **التزامات (تحديث 2026-07-07):** ✅ حُسمت 1-3 — مزامنة Core (#72) · الوضع الداكن (#73) · تطابق نوع السوق (#74). 🔲 متبقٍّ: حدّ معدّل لوكلاء المصادقة · تنظيف الوثائق · تدقيق بيئة Vercel.

---

## 1. طبقات النظام والارتباطات الخارجية

```
                    ┌─────────────────────────────────────────────┐
                    │      المتصفّح / تطبيق الجوال (Flutter)         │
                    └───────────────┬─────────────────────────────┘
                                    │ HTTPS
        ┌───────────────────────────▼──────────────────────────────┐
        │   تطبيق فحص داسم (Next.js 14 على Vercel — inspect.dasm...) │
        │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
        │  │ صفحات (29)   │  │ إجراءات خادم  │  │ نقاط نهاية (28)   │  │
        │  │ (main/public)│  │ (~30)         │  │ /api/*            │  │
        │  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
        │         └────────── طبقة البيانات (lib/data ~89) ──────────┘
        └───────┬───────────────────────────────────┬───────────────┘
                │ service_role (خادم فقط)             │ HTTP + توكنات
     ┌──────────▼───────────┐         ┌──────────────▼────────────────┐
     │ Supabase DASM-services│         │  منصّة داسم (Laravel) على Render │
     │ bmfqfmsxtotdksvcqfrh  │         │  api.dasm.com.sa               │
     │ كل جداول inspection_*  │         │  • تحقّق التوكن /api/user/profile│
     └───────────────────────┘         │  • SSO /api/sso/verify          │
                                        │  • داخلي /api/internal/         │
                ┌───────────────────────┤     dasm-inspection/*           │
                │ مرجع فقط (لا كتابة)     │     (cars, reports, wallet)    │
     ┌──────────▼───────────┐           └────────────────────────────────┘
     │ Supabase DASM-core    │
     │ ttkhiatwayvlfksvehzm  │  المستخدمون + السيارات + المزادات
     └───────────────────────┘
```

**الريبوهات المجاورة:**

| الريبو | العلاقة | الارتباط |
|---|---|---|
| **DASM-Platform** (Laravel) | المنصّة الأم | تحقّق توكن + SSO + مزامنة داخلية؛ `dasm_user_id`/`dasm_car_id` مراجع نصّية |
| **dasm-inspection-mobile** (Flutter) | تطبيق الجوال | **نفس مشروع Supabase ونفس الجداول**؛ يستهلك نقاط `/api/mobile/*` بـ Bearer (Sanctum) |
| **السوق/المبوّبات** (DASM-services) | خدمة شقيقة | ربط تقارير الفحص بإعلانات السوق — **عدم تطابق نوع مرصود: `external_request_id` BIGINT مقابل `inspection_requests.id` UUID (هجرة معلّقة)** |

---

## 2. المسارات (Routes) — 29 صفحة

**المجموعات:** `(main)` = قشرة اللوحة (شريط جانبي + سفلي، محمية بتوكن) · `(public)` = صفحات عامة (الآن **تكيّفية**: تعرض قشرة اللوحة إن كان المستخدم داخلاً، وإلا هيدر/فوتر عام) · `auth/*` + `offline` = مستقلّة.

| المسار | المجموعة | القشرة | حماية | حصر الدور | مربوط من | ملف |
|---|---|---|---|---|---|---|
| `/` | public | تكيّفية | لا | — | هيدر عام | `(public)/page.tsx` |
| `/about` | public | تكيّفية | لا | — | فوتر | `(public)/about` |
| `/privacy` | public | تكيّفية | لا | — | فوتر | `(public)/privacy` |
| `/terms` | public | تكيّفية | لا | — | فوتر | `(public)/terms` |
| `/workshops` | public | تكيّفية | لا | — | **شريط جانبي + سفلي + هيدر** | `(public)/workshops` |
| `/workshops/apply` | public | تكيّفية | لا | — | من /workshops | `(public)/workshops/apply` |
| `/workshops/[slug]` | public | تكيّفية | لا | — | من /workshops | `(public)/workshops/[slug]` |
| `/dashboard` | main | قشرة اللوحة | **نعم** | متعدد | شريط جانبي + سفلي | `(main)/dashboard` |
| `/my-inspections` | main | قشرة اللوحة | **نعم** | dasm_user | شريط جانبي + سفلي | `(main)/my-inspections` |
| `/my-inspections/vehicle/[carId]` | main | قشرة اللوحة | **نعم** | dasm_user | من القائمة | `.../vehicle/[carId]` |
| `/requests` | main | قشرة اللوحة | **نعم** | متعدد | شريط جانبي + سفلي | `(main)/requests` |
| `/requests/[id]` | main | قشرة اللوحة | **نعم** | متعدد | من القائمة | `(main)/requests/[id]` |
| `/reports/[id]` | main | قشرة اللوحة | **نعم** | متعدد | من تفاصيل الطلب | `(main)/reports/[id]` |
| `/track/[id]` | main | قشرة اللوحة | **نعم** | dasm_user | **يتيم** (يُفتح عبر SSO/رابط) | `(main)/track/[id]` |
| `/settings` | main | قشرة اللوحة | **نعم** | متعدد (إدارة للأدمن) | شريط جانبي + سفلي | `(main)/settings` |
| `/subscription` | main | قشرة اللوحة | **نعم** | dasm_user | من /workshops/apply | `(main)/subscription` |
| `/wallet` | main | قشرة اللوحة | **نعم** | dasm_user | شريط جانبي + سفلي | `(main)/wallet` |
| `/workshop` | main | قشرة اللوحة | **نعم** | ورشة/أدمن (يلزم workshop_id) | شريط جانبي + سفلي | `(main)/workshop` |
| `/workshop/{team,pricing,areas,field,reviews,followers,export}` | main | قشرة اللوحة | **نعم** + `requireWorkshopPage()` | ورشة/أدمن | تبويبات + بطاقات من /workshop | `(main)/workshop/*` |
| `/auth/login` · `/auth/callback` · `/auth/social/callback` | مستقلّة | مخصّصة | لا | — | تسجيل الدخول/إعادة توجيه OAuth | `auth/*` |
| `/offline` | مستقلّة | صغرى | لا | — | يتيم (احتياط PWA) | `offline` |

**نتائج التماسك:** ✅ لا روابط مكسورة · ✅ لا تكرار · ✅ كل مفتاح تنقّل له صفحة · ⚠️ يتيمان **مقصودان** (`/track/[id]` عبر SSO، `/offline` احتياط) · ✅ كسر القشرة أُصلح (#70).

**رؤية التنقّل حسب الدور** (`visibleNavKeys`): الأدمن يرى الكل · `dasm_user` كل شيء عدا لوحة الورشة · الورشة (مالك/مدير): لوحة الورشة + الطلبات + المحفظة + الإعدادات فقط · المفتش/الميكانيكي/العارض: عدا المحفظة والاشتراك ولوحة الورشة.

---

## 3. نقاط النهاية (API) — 28

**مجموعات:** SSO/بوابة · مصادقة (وكلاء تمرير للمنصّة) · REST v1 (تكامل خارجي بمفتاح API) · الجوال (Bearer/Sanctum) · عام (قراءات مخبّأة) · تصدير الورشة · إعلانات.

| النقطة | الطرق | الغرض | يتصل بـ | الحماية |
|---|---|---|---|---|
| `/api/gateway` | GET/POST | دخول SSO (يضبط كوكيز) · إنشاء طلب فحص | منصّة + Supabase | GET: توكن؛ POST: مفتاح API + Bearer |
| `/api/auth/login` | POST | تمرير اعتماد للمنصّة | منصّة `/api/login` | **بلا حماية** (تمرير) |
| `/api/auth/logout` | GET/POST | مسح الكوكيز | — | عام |
| `/api/auth/sso-callback` | POST | تحقّق SSO + ضبط كوكيز | منصّة `/api/sso/verify` | يتطلّب sso_token |
| `/api/auth/apple` · `/api/auth/social-exchange` | POST | تمرير دخول اجتماعي | منصّة | **بلا حماية** (تمرير) |
| `/api/v1/inspection-requests` (+`/[id]`) | POST/GET | إنشاء/جلب طلب (تكامل خارجي) | منصّة + Supabase | مفتاح API + Bearer + ملكية |
| `/api/v1/service-pricing` | GET | أسعار الخدمة | Supabase (service_role) | عام مخبّأ |
| `/api/v1/workshops/[slug]` | GET | ملف ورشة عام + تقييمات | Supabase | عام مخبّأ |
| `/api/mobile/requests` (+ `/[id]` + start/on-site/approve/reject) | GET/POST | تدفّق الفحص للجوال | منصّة + Supabase | Bearer + دور |
| `/api/mobile/checklist-items/[itemId]` | PATCH | تحديث بند فحص | منصّة + Supabase | Bearer |
| `/api/mobile/reviews` · `/notifications` (+`/[id]/read`) | GET/POST | تقييمات/إشعارات الجوال | منصّة + Supabase | Bearer |
| `/api/mobile/vehicle-history` (+ maintenance/obd-scans/external-reports) | GET/POST | سجلّ المركبة للجوال | منصّة + Supabase | Bearer |
| `/api/mobile/workshops` | GET | دليل الورش للجوال | Supabase | عام مخبّأ |
| `/api/workshop/export` | GET | تصدير CSV (طلبات/تقييمات/متابعون) | Supabase | كوكي + دور الورشة |
| `/api/ads/serve` · `/api/ads/track` | GET/POST | وسيط إعلانات داسم | منصّة الإعلانات | عام (يفشل بأمان) |

**مخاطر النقاط:** وكلاء المصادقة الثلاثة (login/apple/social-exchange) **بلا حدّ معدّل** (عرضة لتخمين الاعتماد) · التقاطات صامتة `.catch(()=>({}))` تبتلع الأخطاء · لو كان `DASM_GATEWAY_API_KEYS` فارغاً تُرفض كل عمليات الإنشاء عبر البوابة.

---

## 4. إجراءات الخادم (Server Actions) — ~30 في 12 ملفاً

كلها: تستخدم `requireAdminClient()` (service_role) · تتحقّق من الدور (`assertInspectionRoles`/`assertWorkshopManageAccess`) · تستدعي `revalidatePath()` · رسائل عربية + تحقّق من المدخلات.

| الملف | الإجراءات الأبرز | الجدول |
|---|---|---|
| `inspection-workflow.ts` | إنشاء/إسناد/إرسال/بدء/تأكيد ميداني/تقرير للمراجعة/اعتماد/رفض/إلغاء/عرض إصلاح/رفع مرفق | `inspection_requests` + `_reports` + `_report_items` + `_status_history` + `_attachments` |
| `workshop-management.ts` | إضافة مفتش/تفعيله · حفظ الأسعار · مناطق الخدمة | `inspection_inspectors` · `_service_pricing` · `_workshop_service_areas` |
| `workshop-admin.ts` | تعليق/استعادة ورشة · اعتماد/رفض طلب انضمام | `inspection_workshops` · `_workshop_applications` |
| `workshop-reviews.ts` | إرسال تقييم · إشراف (اعتماد/رفض) | `inspection_workshop_reviews` |
| `workshop-follows.ts` | متابعة/إلغاء · إشعار المتابعين · تعليم مقروء | `inspection_workshop_follows` · `_notifications` |
| `workshop-field.ts` | جدولة ميدانية + إحداثيات | `inspection_requests` |
| `workshop-application.ts` | تقديم طلب انضمام عام | `inspection_workshop_applications` |
| `repair-recommendations.ts` | إضافة توصية إصلاح | `inspection_repair_recommendations` |
| `request-messages.ts` | رسالة على خيط الطلب (عميل ↔ ورشة) | `inspection_request_messages` |
| `external-vehicle-reports.ts` · `vehicle-maintenance-records.ts` · `vehicle-obd-scans.ts` | خزنة سجلّ المركبة (تقارير خارجية/صيانة/OBD) | `inspection_external_vehicle_reports` · `_vehicle_maintenance_records` · `_vehicle_obd_scans` |

---

## 5. مخطّط قاعدة البيانات — 19 جدولاً (28 هجرة)

**كلها على DASM-services · RLS مفعّل (deny-all) والخلفية تتجاوزه بـ service_role · محفّزات `updated_at`.**

### جداول الفحص الأساسية
| الجدول | الغرض | مفاتيح |
|---|---|---|
| `inspection_workshops` | ملف الورشة | name, city, slug, owner_user_id, is_verified, is_suspended, dasm_partner_ref |
| `inspection_inspectors` | روستر المفتشين | workshop_id, full_name, dasm_user_id, active |
| `inspection_requests` | **كيان التدفّق الرئيسي** | dasm_car_id, dasm_user_id, status(enum 10 حالات), workshop_id, inspector_id, report_id, service_mode(workshop/field), الرسوم، عرض الإصلاح، حالة الدفع، طوابع الميدان |
| `inspection_reports` | تقرير مكتمل (1/طلب) | request_id(unique), overall_summary, approved_at, approved_by_role, rejection_reason |
| `inspection_report_items` | بنود قائمة الفحص | report_id, section, label, status(pass/warn/fail/na), notes |
| `inspection_attachments` | مرفقات (صور/PDF) | request_id, storage_path, mime_type |
| `inspection_status_history` | سجلّ انتقالات الحالة | request_id, status, actor_role |
| `inspection_service_pricing` | أسعار (ورشة أو افتراضي منصّة) | workshop_id(NULL=افتراضي), service_mode, price_sar, is_active |
| `inspection_workshop_applications` | طلبات الانضمام | workshop_name, contact, commercial_registration, status |
| `inspection_workshop_reviews` | تقييمات (1/فحص معتمد) | workshop_id, rating(1-5), status(pending/approved/rejected) |
| `inspection_workshop_follows` | متابعة الورشة | workshop_id, dasm_user_id |
| `inspection_notifications` | إشعارات داخلية | dasm_user_id, kind, title, read_at |
| `inspection_workshop_service_areas` | مناطق الخدمة | workshop_id, city, district, supports_workshop/field |
| `inspection_repair_recommendations` | توصيات إصلاح | request_id, severity(advisory/minor/major/critical), estimated_cost_sar, status |
| `inspection_request_messages` | خيط رسائل الطلب | request_id, sender_dasm_user_id, sender_role, body |

### جداول سجلّ المركبة (خزنة المستخدم)
| الجدول | الغرض |
|---|---|
| `inspection_external_vehicle_reports` | تقارير خارجية مرفوعة للـOCR (ocr_status, extracted_summary JSONB, maintenance_reminders JSONB) |
| `inspection_vehicle_maintenance_records` | سجلّ الصيانة (service_type enum، عدّاد، due التالي، source) |
| `inspection_vehicle_obd_scans` | فحوص OBD (dtc_codes JSONB، readiness، severity، source) |

**دوال مساعدة:** `inspection_set_updated_at()` · `set_updated_at()` (المشترك) · `inspection_slugify_workshop()`.

---

## 6. الجسر إلى منصّة داسم (Laravel) + التوكنات

| النقطة على المنصّة | من ملف الفحص | التوكن/الترويسة |
|---|---|---|
| `POST /api/user/profile` (تحقّق التوكن) | `inspection-http-auth.ts` | `Authorization: Bearer` |
| `POST /api/login` · `/api/auth/apple` · `/api/auth/social/exchange` | وكلاء `api/auth/*` | تمرير |
| `POST /api/sso/verify` | `api/auth/sso-callback` | sso_token |
| `POST /api/internal/dasm-inspection/cars/minimal` | `ensure-dasm-car-on-core.ts` | `X-DASM-Internal-Token` |
| `POST /api/internal/dasm-inspection/reports/sync` | `push-approved-report-to-core.ts` | `X-DASM-Internal-Token` |
| `GET /api/internal/dasm-inspection/wallet/balance` · `/ledger/summary` | `fetch-inspection-wallet.ts` | `X-DASM-Internal-Token` |

**تدفّق SSO/البوابة:** المنصّة توجّه المستخدم إلى `/api/gateway?token=` → التطبيق يتحقّق التوكن عبر `/api/user/profile` → يضبط كوكيز `inspection_dasm_user_id` + `inspection_ui_role` (14 يوماً، httpOnly) → يوجّه إلى `/requests`.

**خريطة نوع المنصّة → دور الفحص:** admin/super_admin/moderator/programmer → `inspection_admin` · venue_owner/dealer → `workshop_owner` · user → `dasm_user` · غيرها مرفوض.

---

## 7. المصادقة والهوية والكوكيز

- **استخراج التوكن:** Bearer ثم كوكي (`DASM_JWT_COOKIE_NAME` أو `dasm_access_token` أو `inspection_token`).
- **مساران:** (1) تحقّق JWT (`verifyDasmJwt` — HS256 أو JWKS) عند `DASM_JWT_ENFORCE=true`؛ (2) احتياط: تحقّق توكن المنصّة (Sanctum) عبر `/api/user/profile`.
- **الشخصية (persona):** تُشتقّ من ترويسات موثّقة يضبطها الوسيط (thقة `jwt`) أو من كوكيز البوابة (ثقة `gateway_cookie`).
- **الكوكيز:** `inspection_dasm_user_id` (نطاق المستخدم) · `inspection_ui_role` (**عرض فقط — لا يُعتمد أمنياً**) · كوكيز Supabase (الجلسة).
- **الوسيط `middleware.ts`:** يعقّم الترويسات الداخلية (منع الانتحال) · يحدّث جلسة Supabase · عند التفعيل يضخّ ادعاءات JWT كترويسات · يعفي `/`, `/auth/`, `/workshops/`, `/track/`.

---

## 8. متغيّرات البيئة — القائمة الرئيسية

| المتغيّر | مطلوب | الغرض |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | مفتاح المتصفّح |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (خادم) | مفتاح الخدمة (كل الكتابة) |
| `DASM_API_URL` | افتراضي api.dasm.com.sa | رابط المنصّة |
| `DASM_GATEWAY_API_KEYS` | مهم | مفاتيح البوابة (فارغ = رفض الإنشاء) |
| `DASM_CORE_API_URL` | اختياري | رابط Core للمزامنة الداخلية |
| `DASM_INSPECTION_INTERNAL_PULL_TOKEN` | **مهم** | التوكن الداخلي (بلا = مزامنة/محفظة تفشل بصمت) |
| `DASM_INSPECTION_SYNC_ENABLED` | افتراضي true | تفعيل مزامنة التقرير |
| `DASM_JWT_ENFORCE` | افتراضي false | فرض JWT |
| `DASM_JWT_ISSUER` / `_AUDIENCE` / `_SECRET` / `DASM_JWKS_URI` / `DASM_JWT_COOKIE_NAME` | عند فرض JWT | إعداد التحقّق |
| `INSPECTION_ATTACHMENTS_BUCKET` | افتراضي inspection-attachments | حاوية التخزين |
| `INSPECTION_ATTACHMENT_SIGNED_URL_TTL_SEC` | افتراضي 3600 | صلاحية الرابط الموقّع |
| `INSPECTION_PUBLIC_BASE_URL` | افتراضي inspect.dasm.com.sa | روابط التقارير |
| `INSPECTION_CREATE_RATE_LIMIT_PER_MIN` | افتراضي 60 | حدّ الإنشاء |
| `NEXT_PUBLIC_INSPECTION_FEE_PAYMOB_ENABLED` | افتراضي true | زر دفع PayMob |
| `DASM_ADS_API_URL` / `NEXT_PUBLIC_DASM_ADS_API_URL` | اختياري | رابط الإعلانات |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_APPLE_CLIENT_ID` / `NEXT_PUBLIC_DASM_CORE_URL` | اختياري | الدخول الاجتماعي |

---

## 9. «مالنا وما علينا»

### ✅ مالنا (أصول تعمل)
- تدفّق فحص كامل: إنشاء → إسناد → تنفيذ (ورشة/ميداني) → تقرير → اعتماد/رفض، مع سجلّ حالات ومرفقات.
- لوحة ورشة كاملة (فريق، أسعار، مناطق، ميداني، تقييمات، متابعون، تصدير) — مربوطة بتبويبات وبطاقات.
- خزنة سجلّ المركبة (تقارير خارجية + صيانة + OBD) + تذكيرات.
- توصيات إصلاح + محادثة عميل↔ورشة داخل تفاصيل الطلب.
- تكامل منصّة: SSO + بوابة + REST v1 + طبقة جوال كاملة (Bearer).
- هوية بصرية موحّدة (كحلي + أخضر) + خروج + فوتر + قانوني + محفظة + وضع داكن + **قشرة تكيّفية (#70)**.
- بنية سليمة: لا روابط مكسورة، لا تكرار، RLS مقفل، حدّ معدّل على البوابة.

### ⚠️ ما علينا (التزامات — مرتّبة؛ 1-3 حُسمت 2026-07-07)
| # | البند | الخطورة | الحالة / الإصلاح |
|---|---|---|---|
| 1 | مزامنة Core (تقرير/سيارة/محفظة) كانت **تفشل بصمت** | 🔴 عالٍ | **✅ حُسم (#72):** حالة مزامنة دائمة على `inspection_reports` (status/synced_at/error/attempts) + التقاط النتيجة + `retryReportCoreSync()` + كسر صمت المحفظة. يبقى: تأكيد ضبط `DASM_INSPECTION_INTERNAL_PULL_TOKEN` على Vercel (بند 6). |
| 2 | فجوات الوضع الداكن على لوحة الورشة + تفاصيل الطلب | 🟡 متوسط | **✅ حُسم (#73):** أصناف `dark:` على لوحة الورشة + تبويباتها + تفاصيل الطلب + مكوّني P3. |
| 3 | عدم تطابق نوع مع ريبو السوق (`external_request_id` BIGINT ↔ UUID) | 🟡 متوسط | **✅ حُسم (#74):** عمودا UUID + مفتاحان أجنبيان + فهرسان (الجدول 0 صفوف، إصلاح إضافي)؛ القديم DEPRECATED. |
| 4 | وكلاء المصادقة (login/apple/social-exchange) **بلا حدّ معدّل** + التقاطات صامتة | 🟡 متوسط | متبقٍّ: إضافة حدّ معدّل + تسجيل الأخطاء |
| 5 | وثائق قديمة/مفقودة: `DATABASE.md` قديمة · `V1_SCOPE.md`/`IMPLEMENTATION_STATUS.md` مفقودان · `DOMAIN_MODEL.md` مكرّر | 🟡 متوسط | متبقٍّ: أرشفة/تحديث + اعتماد هذه الوثيقة مصدر حقيقة |
| 6 | روابط/توكنات بيئة قد تُنسى على Vercel (بما فيها التوكن الداخلي وبند 1) | 🔵 منخفض | متبقٍّ: تحقّق متغيّرات البيئة عند الإقلاع |
| 7 | اكتشاف `/track/[id]` يعتمد على معرفة الرابط (يتيم مقصود) | 🔵 منخفض | مقبول؛ يُذكر في وثيقة الـSSO |

---

## 10. خطة إعادة الربط (التقدّم)
- ✅ **قشرة تكيّفية** (كسر «الصفحات المستقلة» + الفوتر) — #70.
- ✅ **تأمين مزامنة Core** (بند 1) — #72.
- ✅ **تلميع الوضع الداكن** (بند 2) — #73.
- ✅ **حسم ربط السوق** (بند 3) — #74.
- 🔲 **تصليب المصادقة** (بند 4): حدّ معدّل + تسجيل لوكلاء login/apple/social-exchange.
- 🔲 **تنظيف الوثائق** (بند 5): أرشفة `DATABASE.md` القديمة + إنشاء `IMPLEMENTATION_STATUS.md`.
- 🔲 **تدقيق بيئة Vercel** (بند 6): تأكيد `DASM_INSPECTION_INTERNAL_PULL_TOKEN` + `DASM_GATEWAY_API_KEYS` + `SUPABASE_SERVICE_ROLE_KEY` + تحقّق عند الإقلاع.

---

## المراجع (ملفات مفتاحية)
- القشرة: `components/shared/AppShell.tsx` · `app/(main)/layout.tsx` · `app/(public)/layout.tsx`
- التنقّل: `components/shared/nav-config.ts` · `lib/auth/resolve-inspection-persona.ts`
- الجسر: `app/api/gateway/route.ts` · `lib/api/inspection-http-auth.ts` · `lib/core/*`
- المصادقة: `middleware.ts` · `lib/auth/*`
- البيانات: `lib/data/*` (كلها عبر admin client)
- المخطّط: `supabase/migrations/*.sql`
