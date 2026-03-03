# تعليمات Cursor — مشروع Dasm Inspection

**المرجع المعماري:** `md-files/PROJECT_ANALYSIS.md`  
**لا تُعدّل ملفات `md-files` إلا بطلب صريح من المستخدم.**

---

## 1. التقنية المقترحة

### 1.1 Stack الأساسي

- **Framework:** Next.js (App Router)
- **اللغة:** TypeScript فقط
- **التمرير:** Tailwind CSS
- **مكونات UI:** يمكن استخدام shadcn/ui أو مكونات مبنية على Tailwind

### 1.2 سبب الاختيار

- **Next.js:** دعم SSR/SSG، توجيه مدمج، سهولة النشر على Vercel، دعم API Routes إذا لزم لاحقاً.
- **TypeScript:** أمان الأنواع، تسهيل الصيانة، توثيق أفضل.
- **Tailwind:** سرعة التطوير، اتساق التصميم، تصغير حجم CSS.

---

## 2. تنظيم المجلدات المقترح

### 2.1 هيكل `frontend/`

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── customer/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── cars/
│   │   ├── appointments/
│   │   └── ...
│   ├── workshop/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   └── ...
│   ├── admin/
│   │   ├── layout.tsx
│   │   └── ...
│   └── (auth)/
├── components/
│   ├── ui/           # مكونات أساسية
│   ├── shared/       # مكونات مشتركة
│   ├── customer/     # مكونات خاصة بالعميل
│   ├── workshop/     # مكونات خاصة بالورشة
│   └── admin/        # مكونات خاصة بالإدارة
├── lib/
│   ├── theme.ts
│   ├── utils.ts
│   └── supabase.ts   # لاحقاً
├── hooks/
├── types/
├── store/            # Zustand stores لاحقاً
└── styles/
```

### 2.2 مبدأ التنظيم

- كل دور (customer, workshop, admin) له `layout` خاص وتجربة منفصلة.
- المكونات المشتركة في `shared` تُستورد في الأدوار الأخرى.
- `lib` للدوال المساعدة، الثيم، وإعداد Supabase لاحقاً.

---

## 3. قواعد كتابة الكود

### 3.1 TypeScript

- تفعيل `strict` في `tsconfig.json`.
- تعريف Types/Interfaces لكل props و state.
- تجنب `any` قدر الإمكان.
- وضع الأنواع المشتركة في `types/`.

### 3.2 المكوّنات

- مكونات وظيفية (Functional Components).
- تقسيم المكوّنات عند تجاوز 150–200 سطر تقريباً.
- تسمية واضحة: `CarCard`، `InspectionFormWizard`، `AppointmentTable`.
- Props محددة بواجهة `Props` أو `ComponentNameProps`.

### 3.3 Tailwind

- استخدام Design Tokens (ألوان، مسافات) من `tailwind.config`.
- تجنب قيم مخصصة كثيرة؛ الاعتماد على التدرج في التكوين.
- تسمية Classes منطقية؛ عدم المبالغة في الاختصار.
- دعم RTL عبر `rtl:` عند الحاجة.

### 3.4 النماذج (Forms)

- استخدام React Hook Form.
- التحقق عبر Zod أو Yup.
- رسائل خطأ واضحة ومرئية للمستخدم.

---

## 4. إدارة الحالة (State Management)

### 4.1 Server State

- React Query أو SWR للبيانات من الـ API.
- Cache و refetch وفق سلوك التطبيق (على سبيل المثال: invalidate بعد إنشاء موعد).
- معالجة Loading و Error في واجهات واضحة.

### 4.2 Client State

- Zustand للت state المحلي البسيط:
  - دور المستخدم (customer / workshop / admin)
  - إعدادات الـ theme
  - بيانات محلية مؤقتة قبل الإرسال
- عدم إفراط في الـ stores؛ استخدام state محلي عندما يكفي.

---

## 5. ربط Backend لاحقاً

### 5.1 Supabase (مقترح)

- إنشاء client واحد في `lib/supabase.ts`.
- استخدام Auth من Supabase للمصادقة.
- القراءة/الكتابة عبر Supabase Client أو REST.
- Row Level Security لضبط الوصول حسب الدور.

### 5.2 API Layer

- تجميع استدعاءات الـ API في دوال أو hooks:
  - `useCars`, `useInspections`, `useAppointments`
- فصل منطق الـ API عن واجهة المستخدم.

### 5.3 البيئة

- متغيرات البيئة في `.env.local` (لا ترفعها إلى Git).
- استخدام `NEXT_PUBLIC_` للمتغيرات المعرّضة في المتصفح.

---

## 6. التعامل مع ملفات md-files

- **المرجعية:** استخدم `PROJECT_ANALYSIS.md` لفهم الشاشات والمسارات والمكونات.
- **عدم التعديل:** لا تعدّل محتوى أي ملف داخل `md-files` إلا بطلب صريح من المستخدم.
- **التحديث:** عند تغيير معماري كبير، يمكن اقتراح تحديث التوثيق، لكن التنفيذ فقط بعد موافقة المستخدم.

---

## 7. ترتيب التنفيذ المقترح

1. إنشاء مشروع Next.js في `frontend/`.
2. إعداد Tailwind وتكوين الـ theme.
3. إنشاء Layout أساسي لكل دور.
4. تنفيذ المكونات المشتركة ثم مكونات كل دور.
5. ربط الصفحات بالـ Routes.
6. إضافة ربط Supabase عند توفر الـ Backend.

---

*هذه التعليمات Iteration 1 — ستُحدَّث عند تغيّر قرارات المشروع.*
