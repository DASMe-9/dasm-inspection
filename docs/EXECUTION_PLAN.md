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

## Phase 2 — Auth integration

- Middleware / server session لقراءة JWT من DASM
- عميل Supabase `anon` + تمرير JWT أو `dasm_user_id` في السياق
- ترحيل تدريجي من `requireAdminClient()` للكتابات الحساسة فقط
- توسيع `inspection_app_role` أو طبقة تعيين أدوار (مع ترحيل بيانات تاريخ الحالة)
- اختبار: لا تسريب صفوف بين المستخدمين

**مخرجات مرحلة:** PR منفصل، `permissions-matrix.md` محدّث بحالة «مفعّل»، اختبارات يدوية/تلقائية للـ RLS.

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
