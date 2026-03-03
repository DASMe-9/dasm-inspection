# دليل التعاون — Dasm Inspection

---

## الأدوار

### المستخدم (أنت)
- تقديم الرؤية والقرارات النهائية.
- مراجعة النتائج والموافقة على التغييرات.
- توجيه Cursor و Claude عند الحاجة.

### Cursor
- تنفيذ الكود والتعديلات على المستودع.
- Refactoring و Debugging.
- اتباع تعليمات `CURSOR_INSTRUCTIONS.md`.

### Claude (أو أي نموذج آخر)
- التحليل المعماري العميق.
- القرارات الاستراتيجية.
- مراجعة الكود على مستوى عالٍ.
- حل المشاكل المعقدة.

---

## Pipeline (مراحل العمل)

### Phase 1: Frontend Design & Implementation
- إنشاء مشروع Next.js داخل `frontend/`.
- إعداد Tailwind و Design System.
- تنفيذ المكونات والشاشات بناءً على Figma.
- تجميع الصفحات والـ Routes.

### Phase 2: GitHub + Vercel Deployment
- ربط المستودع بـ GitHub.
- إعداد مشروع Vercel.
- نشر الواجهة.
- إضافة متغيرات البيئة عند الحاجة.

### Phase 3: Backend & Database
- ربط Supabase (أو بديل).
- تنفيذ Schema قاعدة البيانات.
- تنفيذ Authentication.
- ربط الواجهة بالـ API.

---

## نمط العمل المقترح

1. **للمهام التنفيذية:** اطلب من Cursor مباشرة مع الإشارة إلى `TODO.md` أو `CURSOR_INSTRUCTIONS.md`.
2. **للقرارات المعمارية:** استشر Claude ثم انقل الخطة لـ Cursor.
3. **للمراجعة:** اطلب من Claude مراجعة الكود بعد انتهاء Cursor.
4. **للتوثيق:** عدّل ملفات `md-files` بطلب صريح فقط.

---

*هذا الدليل Iteration 1 — يُحدَّث مع تطور المشروع.*
