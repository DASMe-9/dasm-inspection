# Staging-only — RLS rollout (Phase 2b)

**لا تُطبَّق هذه الملفات على إنتاج inspection.**  
الغرض: نسخة قابلة للتجربة على **مشروع Supabase staging** بعد ربط JWT المستخدم بـ `auth.jwt()` (قالب توكن Supabase أو تبادل جلسة من DASM).

## الخطوات

1. أنشئ/استخدم مشروع Supabase **staging** منفصل.
2. طبّق الهجرات القياسية من `supabase/migrations/` على staging.
3. اضبط قالب JWT في Supabase بحيث تظهر المطالبات المطلوبة في `auth.jwt()` (أو `app_metadata`) — انظر `docs/identity-integration.md`.
4. راجع `phase2b_rls_template.sql` وعدّل أسماء المطالبات لتطابق القالب الفعلي.
5. نفّذ الملف يدوياً على staging (SQL Editor أو `psql`) — **لا** تضعه في `migrations/` لكي لا يُطبَّق على الإنتاج بالخطأ.

## التراجع

- أعد إنشاء سياسات التطوير المفتوحة من `20260404120000_inspection_v1_core.sql` للجداول المتأثرة، أو استعد من نسخة احتياطية.
