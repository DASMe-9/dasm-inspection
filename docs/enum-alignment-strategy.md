# Enum Alignment Strategy — `inspection_app_role` (Phase 2)

**الهدف:** محاذاة أدوار المنتج المعتمدة (`workshop_owner`, `mechanic`, `inspector`, `dasm_user`, `inspection_admin`) مع قاعدة البيانات **دون** كسر `inspection_status_history` أو أي عمود يستخدم `inspection_app_role`.

---

## 1. الواقع الحالي (Audit)

**نوع Postgres:** `inspection_app_role`  
**القيم الموجودة في الهجرة الأساسية:**

- `super_admin`
- `inspection_admin`
- `workshop_manager`
- `inspector`
- `viewer`

**الاستخدام في البيانات:**

- عمود `inspection_reports.approved_by_role` من نوع `inspection_app_role`
- عمود `inspection_status_history.actor_role` من نوع `inspection_app_role` مع قيمة افتراضية `inspection_admin`

**ممنوع:** حذف أو إعادة تسمية قيم enum مستخدمة في صفوف تاريخية (قد يكسر القراءة أو التحقق).

---

## 2. الفجوة مقابل أدوار DASM المعتمدة

| دور منتج (DASM / inspection scoped) | أقرب قيمة enum حالية | ملاحظة |
|--------------------------------------|------------------------|--------|
| `inspection_admin` | `inspection_admin` | تطابق |
| `workshop_owner` | `workshop_manager` | تسمية مختلفة؛ دلالة قريبة |
| `inspector` | `inspector` | تطابق |
| `mechanic` | — | غير موجود؛ يحتاج قيمة جديدة أو تعيين مؤقت إلى `inspector` في طبقة التطبيق |
| `dasm_user` | `viewer` | دلالة قراءة فقط؛ تسمية غير واضحة للعميل |
| Global platform admin | `super_admin` | خارج نطاق الفحص اليومي؛ يُحصر تشغيلياً |

---

## 3. استراتيجية التوافق (Compatibility strategy)

### المبدأ

1. **الإبقاء على جميع القيم القديمة** في الـ enum إلى أجل غير مسمى (أو حتى ترحيل بيانات تاريخي مُخطَّط).
2. **إضافة قيم جديدة فقط** (additive migration) للقيم الناقصة: `workshop_owner`, `mechanic`, `dasm_user`.
3. **طبقة التطبيق (mapper):** عند استلام JWT من DASM، تحويل الأدوار العالمية + `inspection_role` إلى قيمة enum **إما** جديدة **أو** قديمة للتوافق مع السجلات.

### خريطة قراءة التاريخ (History semantics)

- صفوف `inspection_status_history` التي تحتوي `workshop_manager` تبقى **صحيحة منطقياً**؛ في الواجهة يمكن عرض التسمية «مالك ورشة (سجل قديم)» أو توحيد العرض إلى «workshop_owner».
- لا إعادة كتابة تلقائية للتاريخ في Phase 2 (اختياري لاحقاً بمهمة ترحيل منفصلة وموافقة).

### كتابة القيم الجديدة

- السجلات **الجديدة** يُفضَّل أن تستخدم `workshop_owner` بدلاً من `workshop_manager` عند الإسناد من طبقة الهوية الجديدة.
- `mechanic`: يُستخدم عند تمييز الفني عن المفتش؛ حتى ذلك يمكن للتطبيق إرسال `inspector` للسجل إن كان المنتج لا يفرق بعد.

---

## 4. مسار هجرة آمن (Migration-safe path)

**الخطوة 1 (منفَّذة في Phase 2 كجزء آمن):** هجرة إضافية تضيف القيم:

- `workshop_owner`
- `mechanic`
- `dasm_user`

**الخطوة 2 (لاحقاً):** تحديث TypeScript `AppRole` وطبقة الـ mapper لتشمل القيم الجديدة.

**الخطوة 3 (اختياري، Phase 3+):** سياسات RLS وقراءة JWT لا تعتمد على «إزالة» القيم القديمة.

**الخطوة 4 (اختياري، قرار معماري):** ترحيل لمرة واحدة:

```sql
-- مثال فقط — لا يُنفَّذ تلقائياً
-- UPDATE inspection_status_history SET actor_role = 'workshop_owner'::inspection_app_role
-- WHERE actor_role = 'workshop_manager'::inspection_app_role;
```

يُنفَّذ فقط بعد نسخ احتياطي واختبار وموافقة منتج.

---

## 5. مخاطر مرفوضة

- `ALTER TYPE ... RENAME VALUE` — غير مدعوم بشكل موثوق عبر إصدارات PG؛ يُتجنب.
- حذف قيمة enum مستخدمة في عمود — **مرفوض**.
- تغيير نوع العمود إلى `text` لإعادة تصميم الأدوار — **خارج Phase 2** (قرار معماري منفصل).

---

## 6. مراجع

- `supabase/migrations/20260404220000_phase2_inspection_app_role_extend.sql`
- `frontend/src/types/index.ts` — اتحاد `AppRole`
- `permissions-matrix.md` — مصفوفة الأدوار
