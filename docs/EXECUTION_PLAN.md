# Execution Plan — DASM Inspection (Phased)

تنفيذ آمن، قابل للتراجع، **PR-driven**؛ ممنوع الدمج على `main`/`master` دون مراجعة.

---

## Phase 1 — Architecture + schema documentation ✅ (this delivery)

**المخرجات:**

- `ARCHITECTURE.md` — وثيقة المعمارية Phase 1 (وحدات، حدود، تدفق بيانات وهوية، ملكية، site map، workflow)
- `domain-model.md` — علاقات، enums، فهارس، RLS مستهدف
- `api-contract.md` — Server Actions الحالية + HTTP مقترح
- `permissions-matrix.md` — أدوار معتمدة مقابل DB + مصفوفة وصول
- `EXECUTION_PLAN.md` — هذا الملف

**ما لم يُغيَّر عمداً:** مخطط Postgres الحي (تجنب كسر الإنتاج)؛ توثيق الفجوات (أدوار enum، RLS الحقيقي).

**التحقق:** `cd frontend && npm run lint && npx tsc --noEmit && npm run build`

**Rollback:** `git revert` على commits الوثائق.

---

## Phase 2 — Auth integration (جزء التصميم + أساس DB غير كاسر — مُنجَز توثيقياً)

**مُسلَّم في الريبو:**

- [`identity-integration.md`](./identity-integration.md) — مصدر الهوية، نموذج الثقة، عقد JWT، fallback
- [`enum-alignment-strategy.md`](./enum-alignment-strategy.md) — استراتيجية enum بدون كسر التاريخ
- [`rls-policies.md`](./rls-policies.md) — تصميم سياسات RLS لكل جدول + خطة rollout
- [`permissions-matrix.md`](./permissions-matrix.md) — خريطة DASM ↔ scoped ↔ enum
- هجرة additive: `supabase/migrations/20260404220000_phase2_inspection_app_role_extend.sql`
- TypeScript: `AppRole` يتضمن القيم الجديدة

**المتبقي (Phase 2b / بداية Phase 3):** Middleware لـ JWT DASM، تبادل جلسة Supabase، استبدال سياسات `USING (true)` على staging ثم الإنتاج، اختبارات عدم تسريب.

**مخرجات مرحلة حالية:** PR منفصل؛ RLS **غير** مُفعَّل كسياسات إنتاجية جديدة في الهجرة (تصميم فقط) لتفادي كسر عملاء `authenticated` الحاليين.

---

## Phase 3 — Dashboard + workflows

- تقسيم واجهات أو مسارات حسب الدور (أو نفس المسار مع فلترة)
- جداول قابلة للإنتاج (فرز، حالات، روابط)
- تحسين خط زمني الحالة وعرض المرفقات (signed URLs)
- إجراءات workflow خاضعة لنفس قواعد RLS

**مخرجات مرحلة:** PR، لقطات/اختبار دخان للمسارات الحرجة.

---

## Phase 4 — Reporting + production hardening

- تقارير تصدير/طباعة إن لزم
- مراقبة أخطاء، حدود معدل، تعزيز headers
- سياسات Storage كاملة
- Runbook نشر وتراجع

---

## صيغة ملخص كل PR (إلزامي)

- **What changed**
- **Why changed**
- **Impact scope**
- **Risk level**
- **Verification result** (lint / typecheck / build / smoke)
- **Rollback plan** (revert PR / restore component)

---

## Deployment gate

لا نشر إذا: فشل البناء، تغيير مصادقة بلا تحقق، RLS غير مختبرة، أو انحدار في حالات الـ workflow.
