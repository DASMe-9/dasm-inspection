# Identity Integration — DASM ↔ Inspection (Phase 2)

**الغرض:** تعريف كيف تثق خدمة الفحص بهوية DASM **دون** بناء نظام تسجيل دخول مستقل أو جدول `users` بديل.

**الحالة التشغيلية اليوم:** تطبيق Next.js يستخدم **Supabase service role** على الخادم فقط؛ **لا يوجد** تحقق من JWT المستخدم النهائي في المسار الحرج بعد. هذا مقبول للتطوير الداخلي فقط.

---

## 1. مصدر الهوية (Source of truth)

| المصدر | المحتوى |
|--------|---------|
| **DASM Platform** | الحساب، الأدوار العالمية، الجلسة/التوكن، ربط المستخدم بالمركبة والمزاد |
| **Inspection DB** | مراجع فقط: `dasm_user_id`, `dasm_car_id`, `dasm_partner_ref`؛ وجداول الورشة/المفتش/الطلب |

**ممنوع:** تخزين كلمات مرور، تسجيل مستخدمين محليين، أو نسخ نموذج هوية DASM كاملاً داخل inspection.

---

## 2. مصدر التوكن (Token source)

| السيناريو | مصدر التوكن | من يستهلكه |
|-----------|-------------|------------|
| **A — موصى به للإنتاج** | المستخدم يُصدَر له JWT من DASM (أو بوابة SSO موحدة) | متصفح → **Next.js** (middleware / Server Components) |
| **B — جلسة Supabase** | Edge Function أو Route Handler يتحقق من JWT DASM ثم يُنشئ جلسة Supabase قصيرة العمر | عميل Supabase `anon` + `Authorization` |
| **C — خادم فقط (الوضع الحالي)** | لا JWT للمستخدم في الطلب | Server Actions + **service role** (يتجاوز RLS) |

الانتقال المستهدف: **A → B** أو **A مع تحقق خادم ثم استعلام بصلاحية محدودة** حسب قرار أمني نهائي.

---

## 3. نموذج التحقق من التوكن (Validation model)

### 3.1 عند استقبال JWT من DASM في Next.js

1. **التحقق التوقيعي:** التحقق من التوقيع مقابل **JWKS** أو سر مشترك يُدار من DASM (لا يُخزَّن في العميل).
2. **التحقق الزمني:** `exp`, `nbf` (إن وُجدت).
3. **التحقق من المصدر:** `iss` (issuer) و`aud` (audience) ضمن قائمة مسموحة لـ inspection فقط.
4. **استخراج المطالبات (claims)** اللازمة للتفويض (انظر عقد المطالبات أدناه).

### 3.2 عند تمرير الهوية إلى Supabase

- إما **جلسة Supabase** بعد تبادل موثوق (Option B)،
- أو **Custom Access Token** وفق إعدادات Supabase المدعومة لديكم (يتطلب توثيق إصدار Supabase).

### 3.3 حد الثقة (Trust boundary)

```
[متصفح المستخدم]
       │ JWT صادر عن DASM (أو SSO)
       ▼
[inspection.dasm.com.sa — Next.js]
       │ تحقق توقيع + مطالبات
       ├──► استعلامات بـ service role (حالي) — ثقة كاملة في الخادم
       └──► (مستقبل) استعلامات بـ role مقيد + RLS تعتمد على JWT/جلسة
       ▼
[Supabase Postgres]
```

**القاعدة:** لا تثق بالمتصفح لإرسال `dasm_user_id` كمعرّف وحيد؛ يجب أن يطابق مطالبة موقّعة أو جلسة مُصدَّرة من خادم يثق بـ DASM.

---

## 4. عقد مطالبات JWT المقترح (Claims contract)

قيم المفاتيح **اقتراحية**؛ يجب توحيدها مع فريق DASM قبل التنفيذ.

| Claim | نوع | إلزامي | الوصف |
|-------|-----|--------|--------|
| `sub` | string | نعم | معرّف مستقر للمستخدم في منظومة DASM |
| `iss` | string | نعم | جهة الإصدار |
| `aud` | string \| string[] | نعم | جمهور مسموح (يشمل معرف تطبيق inspection إن لزم) |
| `exp` | number | نعم | انتهاء الصلاحية |
| `iat` | number | يُفضَّل | وقت الإصدار |
| `dasm_user_id` | string | يُفضَّل | يطابق `sub` أو مرجع منصة صريح؛ يُستخدم في RLS لمطابقة `inspection_requests.dasm_user_id` |
| `dasm_roles` | string[] | يُفضَّل | أدوار عالمية في DASM (مثلاً `auction_user`, `platform_admin`) |
| `inspection_role` | string | يُفضَّل للـ RLS | دور مُقيَّد بنطاق الفحص: `inspection_admin` \| `workshop_owner` \| `mechanic` \| `inspector` \| `dasm_user` |
| `workshop_id` | uuid | اختياري | ورشة المستخدم عند دور الورشة |
| `inspector_record_id` | uuid | اختياري | مطابقة صف `inspection_inspectors.id` عند دور المفتش |
| `permissions` | string[] | اختياري | صلاحيات دقيقة إن اعتمدتم نموذج RBAC مرن |

**ملاحظة:** يمكن دمج `inspection_role` داخل `dasm_roles` ببادئة (مثلاً `inspection:inspector`) إذا كان أبسط تشغيلياً؛ عندها يُعرَّف محوّل في طبقة التطبيق (انظر `enum-alignment-strategy.md`).

---

## 5. السلوك عند غياب المطالبات (Fallback)

| السياق | السلوك الآمن |
|--------|----------------|
| لا JWT أو توكن منتهٍ | رفض الوصول للموارد المحمية؛ إعادة توجيه لتسجيل الدخول في DASM |
| JWT صالح لكن بدون `inspection_role` | اعتبار المستخدم **dasm_user** للقراءة فقط إن وُجد `dasm_user_id` مطابق للطلب؛ وإلا رفض |
| مسار تشغيل داخلي (cron, مهام خلفية) | **service role** على الخادم فقط؛ لا يمر عبر RLS المستخدم |

**ممنوع:** فتح `USING (true)` على `authenticated` في الإنتاج كسياسة دائمة.

---

## 6. مقارنة نماذج الثقة (Tradeoffs)

| النموذج | الإيجابيات | السلبيات |
|---------|------------|----------|
| Service role لكل شيء (حالي) | بساطة، سرعة تطوير | لا RLS للمستخدم؛ خطر إن تسرّب المفتاح |
| JWT DASM + تحقق Next + استعلام service role مع فلترة يدوية في الكود | تحكم في التطبيق دون تغيير DB فوراً | تكرار منطق الصلاحيات إن لم تُضف RLS لاحقاً |
| JWT → جلسة Supabase + RLS | دفاع عميق في DB؛ أقل تسرّب بيانات | تعقيد تبادل التوكن وصيانة الجلسات |

**التوصية المرحلية:** إكمال توثيق RLS (`rls-policies.md`)، ثم تفعيل الجلسة/المطالبات في Supabase، ثم **استبدال** سياسات `authenticated` المفتوحة الحالية وفق خطة rollout.

---

## 7. مراجع

- `permissions-matrix.md` — من يرى ماذا
- `enum-alignment-strategy.md` — مطابقة الأدوار مع `inspection_app_role`
- `rls-policies.md` — سياسات SQL مرجعية
- `EXECUTION_PLAN.md` — تسلسل التنفيذ
- **`phase2b-dasm-jwt-middleware.md`** — تنفيذ middleware + رؤوس موثوقة + قالب RLS لـ staging (اختياري عبر `DASM_JWT_ENFORCE`)
