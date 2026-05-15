# DASM Inspection

> **⚠️ تسميات:** اسم الريبو ومستودع GitHub **`dasm-inspection`**؛ **الدومين العام للإنتاج** **`https://inspect.dasm.com.sa`** (بادئة **`inspect`**). الفرق عن كلمة «inspection» في الجداول (`inspection_requests`، إلخ) مقصود — لا تعتمد دوميناً باسم `inspection.dasm.com.sa` في الـ env أو الاختبارات دون قرار منتج صريح.

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
| [`identity-integration.md`](docs/identity-integration.md) | Phase 2: هوية DASM، JWT، نموذج ثقة، fallback |
| [`phase2b-dasm-jwt-middleware.md`](docs/phase2b-dasm-jwt-middleware.md) | Phase 2b: middleware JWT، رؤوس موثوقة، قالب RLS لـ staging |
| [`enum-alignment-strategy.md`](docs/enum-alignment-strategy.md) | Phase 2: enum آمن، توافق مع التاريخ |
| [`rls-policies.md`](docs/rls-policies.md) | Phase 2: تصميم RLS لكل جدول + rollout |
| [`api-contract.md`](docs/api-contract.md) | Server Actions الحالية + عقود HTTP مقترحة |
| [`permissions-matrix.md`](docs/permissions-matrix.md) | أدوار DASM المعتمدة مقابل DB والوصول المستهدف |
| [`EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md) | مراحل 1–4 وحوكمة PR |
| [`V1_SCOPE.md`](docs/V1_SCOPE.md) | حدود المنتج |
| [`IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) | مقارنة كود اليوم مقابل المراحل و`V1` (يُحدَّث عند التدقيق الدوري) |
| [`DASM_INTEGRATION.md`](docs/DASM_INTEGRATION.md) | تكامل المنصة |
