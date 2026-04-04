# DASM Inspection

تطبيق **فحص سيارات / ورش** مبني على **Next.js 14** (`frontend/`) و**Supabase** (Postgres + RLS).

## التشغيل السريع

```bash
cd frontend
cp .env.example .env.local
# املأ NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

من جذر الريبو يمكن استخدام `npm run dev` (يستدعي `frontend`).

## قاعدة البيانات

- الهجرات: `supabase/migrations/`
- طبّقها على مشروع Supabase (CLI أو لوحة التحكم). جداول المجال تبدأ بـ `inspection_`.
- بذور تجريبية للورش والمفتشين: `supabase/seed.sql`

## أرشيف Vite

المشروع القديم **Vite + React** نُقل إلى `legacy/vite-prototype/` ولا يُستخدم للمنتج.

## التوثيق (`docs/`)

| الملف | الغرض |
|-------|--------|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | معمارية Phase 1 (وثيقة الحوكمة *architecture*): وحدات، حدود، تدفق بيانات/هوية، site map |
| [`domain-model.md`](docs/domain-model.md) | مخطط مجال، علاقات، فهارس، RLS مستهدف |
| [`DOMAIN_MODEL.md`](docs/DOMAIN_MODEL.md) | فهرس سريع → `domain-model.md` |
| [`api-contract.md`](docs/api-contract.md) | Server Actions الحالية + عقود HTTP مقترحة |
| [`permissions-matrix.md`](docs/permissions-matrix.md) | أدوار DASM المعتمدة مقابل DB والوصول المستهدف |
| [`EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md) | مراحل 1–4 وحوكمة PR |
| [`V1_SCOPE.md`](docs/V1_SCOPE.md) | حدود المنتج |
| [`DASM_INTEGRATION.md`](docs/DASM_INTEGRATION.md) | تكامل المنصة |
