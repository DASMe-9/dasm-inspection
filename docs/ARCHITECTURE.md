# DASM Inspection — Final Architecture (Phase 1)

**الإصدار:** Phase 1 — وثيقة معمارية وتصميم بيانات (تنفيذ توثيقي؛ لا تستبدل تشغيل الإنتاج دون مراجعة).  
**النطاق:** `inspection.dasm.com.sa` — مستودع وقاعدة وواجهة وSupabase **مستقلة** عن منصة DASM الأساسية، مع هوية ومراجع مؤسسية مشتركة.

---

## 1. مبادئ الحوكمة

| المبدأ | التطبيق |
|--------|---------|
| Repository مستقل | `dasm-inspection` فقط لمجال الفحص |
| Supabase / DB مستقلة | بادئة جداول `inspection_*`؛ لا جداول شحن أو لوجستيات |
| لا auth نظام مستقل | المصدر: **DASM Platform** (JWT / جلسة موحدة لاحقاً) |
| لا تعديل DASM core | تكامل عبر API/Token فقط |
| نهاية دورة الفحص | بعد `approved` / `rejected` / `cancelled` — **لا** post-inspection workflow |

---

## 2. Hard boundaries (ممنوع إعادة إدخالها)

**مستبعد بالكامل من هذا المستودع** (مستودع شحن منفصل لاحقاً):

- `shipping`, `delivery`, `logistics`, `handoff workflow`, `courier`, `fulfillment`
- أي جداول أو Server Actions أو مسارات UI لما بعد اعتماد/رفض الفحص بغرض النقل أو التسليم

**سبب الاستبعاد:** فصل الملكية، تقليل مساحة الهجوم، وضوح RLS، وعدم خلط سياق الورش مع سياق اللوجستيات.

التفاصيل التاريخية للتنظيف: انظر `supabase/migrations/20260404130000_drop_inspection_shipping_handoffs.sql` و`V1_SCOPE.md`.

---

## 3. الوحدات (Modules) وحدود المسؤولية

```
┌─────────────────────────────────────────────────────────────┐
│                    DASM Platform (خارج الريبو)                │
│         Identity · SSO/JWT · أدوار المنصة · مركبات/مزادات    │
└───────────────────────────┬─────────────────────────────────┘
                            │ token / user ref (dasm_user_id)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js App (inspection frontend)               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ app/(main)  │  │ Server       │  │ components/         │ │
│  │ dashboards  │  │ Actions      │  │ inspection · shared │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                │                      │           │
│         └────────────────┼──────────────────────┘           │
│                          ▼                                  │
│              lib/data/* · lib/supabase/admin               │
└───────────────────────────┬─────────────────────────────────┘
                            │ service role / anon + JWT (مستقبل)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase (Postgres + Storage + RLS)         │
│  inspection_workshops · inspectors · requests · reports ·  │
│  report_items · attachments · status_history                 │
└─────────────────────────────────────────────────────────────┘
```

| الوحدة | المسؤولية | يمنع |
|--------|-----------|------|
| `app/(main)/*` | صفحات لوحة التحكم، قوائم، تفاصيل، تقارير | استدعاء مباشر لمنصة DASM بدون طبقة تكامل |
| `app/actions/*` | انتقالات workflow، كتابة تاريخ الحالة | منطق مصادقة مكرر؛ مفاتيح في العميل |
| `lib/data/*` | استعلامات القراءة، تجميع النماذج | تجاوز سياسات الوصول عند الاعتماد على anon |
| `lib/supabase/*` | عميل خادم آمن | تسريب `SUPABASE_SERVICE_ROLE_KEY` للمتصفح |
| `components/inspection/*` | UI مجال الفحص | حقول أو تدفقات شحن/تسليم |

---

## 4. تدفق البيانات (Data flow)

1. **قراءة (RSC):** الصفحة تستدعي دوال `lib/data/inspection.ts` → `getAdminClient()` (اليوم) أو عميل `anon` + JWT (الهدف) → Postgres.
2. **كتابة:** واجهة المستخدم → Server Action (`inspection-workflow.ts`) → `requireAdminClient()` → `INSERT`/`UPDATE` + `inspection_status_history`.
3. **مرفقات (مستقبل):** رفع إلى **Supabase Storage**؛ المسار في `inspection_attachments.storage_path`؛ عرض عبر signed URL بصلاحية دورية.

**اليوم (V1 تشغيلي):** مفتاح الخدمة على الخادم يتجاوز RLS — مناسب للتطوير الداخلي فقط. **الهدف الإنتاجي:** JWT من DASM في `Authorization` → RLS تربط الصفوف بـ `auth.uid()` أو `dasm_user_id` المطابَق.

---

## 5. تدفق الهوية (Auth flow) — هدف معماري

```
مستخدم DASM يسجّل دخوله في المنصة الأم
        → إصدار JWT (أو تمرير جلسة موثوقة)
        → زيارة inspection.dasm.com.sa
        → Next.js يتحقق من التوكن (middleware / server)
        → يُمرَّر إلى Supabase كـ custom claim أو يُستخرج dasm_user_id
        → RLS تسمح بصفوف: طلباته، ورشته، إسناد مفتشه، إلخ
```

**لا يُبنى:** تسجيل مستخدمين، كلمات مرور، أو جداول `users` محلية لهذا المنتج.

---

## 6. خريطة الملكية (Ownership map)

| كيان | المالك المنطقي | مفتاح ربط DASM |
|------|----------------|-----------------|
| Workshop | شريك ورشة معتمد | `dasm_partner_ref` |
| Inspector | الورشة / المنصة | `dasm_user_id` |
| Inspection request | عميل/منصة | `dasm_user_id`, `dasm_car_id` |
| Report | الورشة + المفتش | عبر `request_id` |
| Attachments | الطلب/التقرير | — |

**قاعدة:** كل دور يرى فقط الصفوف المرتبطة بمراجع هويته (انظر `permissions-matrix.md`).

---

## 7. Site map (مستهدف حسب الدور)

| المسار / المنطقة | inspection_admin | workshop_owner | inspector | dasm_user (عميل) |
|------------------|:----------------:|:----------------:|:---------:|:----------------:|
| `/` لوحة عامة | ✓ | ✓ scoped | ✓ scoped | ✓ طلباته فقط (مستقبل) |
| `/requests` | ✓ الكل | ورشته | المسند له | طلباته |
| `/requests/[id]` | ✓ | إن كانت لورشته | إن كان مسنداً | إن كان مالك الطلب |
| `/reports/[id]` | ✓ | ورشته | إن كان كاتب التقرير | قراءة عند الموافقة (سياسة منتج) |
| `/workshops` | ✓ | ورشته | — | — |
| `/workshops/[id]` | ✓ | ورشته فقط | عرض محدود | — |
| `/settings` | ✓ | تفضيلات محدودة | — | — |

**اليوم:** الواجهة موحدة بدون تقسيم مسارات حسب الدور؛ تطبيق العمود يبدأ في Phase 3 مع RLS + middleware.

---

## 8. هيكل الواجهة (UI structure) — مستهدف production-grade

- **لوحات:** `/` ملخص KPI، قوائم طلبات، تنبيهات مراجعة.
- **جداول:** قوائم `requests` و`workshops` مع فرز/تصفية (توسيع تدريجي).
- **تفاصيل الطلب:** إسناد، خط زمني (`StatusTimeline`)، مرفقات، رابط التقرير.
- **تقرير:** بنود `report_items`، ملخص، حالة اعتماد/رفض.
- **مرفقات:** عارض قائمة + روابط موقّعة (عند تفعيل Storage).

---

## 9. Workflow (نهاية الدورة)

```
Request Created (draft | submitted)
    → Assigned
    → Inspection In Progress
    → Draft Report (منطقياً: أثناء in_progress حتى إرسال التقرير)
    → Review (pending_review)
    → Approved | Rejected | Cancelled  ← نهاية الدورة
```

لا خطوات بعد `Approved` / `Rejected` / `Cancelled` داخل هذا المنتج.

---

## 10. وثائق مرافقة

| الملف | المحتوى |
|-------|---------|
| `domain-model.md` | كيانات، مخطط منطقي، فهارس، RLS المستهدفة |
| `identity-integration.md` | Phase 2: تكامل الهوية مع DASM، JWT، حدود الثقة |
| `enum-alignment-strategy.md` | Phase 2: محاذاة `inspection_app_role` دون كسر التاريخ |
| `rls-policies.md` | Phase 2: تصميم سياسات RLS وخطة rollout |
| `api-contract.md` | عقود API داخلية/خارجية مقترحة |
| `permissions-matrix.md` | أدوار DASM ↔ enum ↔ وصول |
| `EXECUTION_PLAN.md` | مراحل 1–4 وملخصات التسليم |
| `V1_SCOPE.md` | حدود المنتج والجداول المعتمدة |
| `DASM_INTEGRATION.md` | افتراضات التكامل مع المنصة |

---

## 11. Rollback / PR

- **تراجع وثائقي:** `git revert` على commit الوثائق.
- **هجرة Phase 2 (enum):** تراجع بـ `git revert`؛ إزالة قيم enum من PostgreSQL غير مباشرة — تخطيط استعادة عبر نسخ احتياطي DB إن طُبِّق على إنتاج.

---

## 12. التحقق الإلزامي (للمطورين قبل الدمج)

```bash
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

`Ready for Merge`: بعد مراجعة فنية للوثائق وموافقة المعماري.
