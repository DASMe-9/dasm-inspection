# قائمة المهام — Dasm Inspection

**المرحلة الحالية:** Iteration 1 (توثيق) — سيتم تنفيذ Phase 1 لاحقاً بطلب صريح.

---

## Phase 1: Frontend (Next.js + Tailwind)

### إعداد المشروع
- [ ] إنشاء مشروع Next.js داخل `frontend/`
- [ ] إعداد TypeScript
- [ ] إعداد Tailwind CSS
- [ ] تكوين Design Tokens في `tailwind.config` (ألوان، مسافات)

### Layout و Routes
- [ ] إنشاء Layout أساسي للتطبيق
- [ ] إنشاء Layout لتطبيق العميل (`/customer/*`)
- [ ] إنشاء Layout لتطبيق الورشة (`/workshop/*`)
- [ ] إنشاء Layout لوحة الإدارة (`/admin/*`)
- [ ] إعداد Routes الأساسية

### UI Components — Shared
- [ ] Button (Primary, Secondary, Outline)
- [ ] Card
- [ ] Input, Select
- [ ] Badge (للحالات)
- [ ] LoadingSpinner, EmptyState, ErrorState
- [ ] AppShell (Top Bar + Bottom Nav)

### UI Components — Customer
- [ ] CarCard
- [ ] CarAvatar
- [ ] InspectionSummaryCard
- [ ] AppointmentCard
- [ ] QRCodeDisplay

### UI Components — Workshop
- [ ] AppointmentListItem
- [ ] InspectionFormWizard (خطوات)
- [ ] PhotoUploadGrid
- [ ] CarHistoryTimeline

### UI Components — Admin
- [ ] StatsCard
- [ ] DataTable
- [ ] UserRow, WorkshopRow
- [ ] StatusBadge

### صفحات العميل
- [ ] Onboarding
- [ ] Login
- [ ] Home / Dashboard
- [ ] Car Profile
- [ ] Inspection Report
- [ ] Book Appointment
- [ ] Notifications
- [ ] Profile

### صفحات الورشة
- [ ] Workshop Dashboard
- [ ] Appointments List
- [ ] Inspection Form
- [ ] Car History

### صفحات الإدارة
- [ ] Admin Dashboard
- [ ] إدارة الورش
- [ ] إدارة المستخدمين
- [ ] مراقبة الفحوصات

---

## Phase 2: Deployment

- [ ] ربط المستودع بـ GitHub
- [ ] إنشاء مشروع Vercel
- [ ] إعداد متغيرات البيئة
- [ ] نشر الواجهة
- [ ] اختبار الرابط المنشور

---

## Phase 3: Backend & Database (Placeholder)

- [ ] إنشاء مشروع Supabase
- [ ] تنفيذ Database Schema (Users, Cars, Workshops, Inspections, Appointments, …)
- [ ] تفعيل Authentication
- [ ] ربط الواجهة بالـ API
- [ ] إدارة الصور (رفع، تخزين)

---

*هذه القائمة Iteration 1 — تُحدَّث مع تقدم المشروع.*
