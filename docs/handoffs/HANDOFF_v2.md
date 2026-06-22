# HANDOFF v2 — Claude deliverables → Cursor

> **نوع:** Background knowledge — لا يقطع التسلسل **37 → 39 → 40 → 41+**.  
> **تاريخ:** 2026-05-22  
> **PR مرجعي:** `docs/claude-deliverables-v2` (لا يُدمج حتى مراجعة محمد)

---

## ملفات هذا التسليم

| المسار | الاستخدام |
|--------|-----------|
| `docs/schemas/dasm_inspection_schema.json` | مرجع JSONB (mvpi / workshop / history) |
| `docs/architecture/inspection-integration.md` | ربط DASM-core ↔ DASM-services |
| `supabase/migrations/_proposed/extend_inspection_reports.sql` | **مقترح فقط** — لا يُنفَّذ تلقائياً |
| `frontend/src/lib/inspection/scoring.ts` | استيراد مباشر — لا إعادة كتابة المنطق |
| `frontend/src/lib/inspection/scoring.test.ts` | `npm run test:unit` |
| `docs/handoffs/cursor_findings_handoff.md` | (Platform) اكتشافات Supabase السابقة |

---

## تسلسل Cursor (إلزامي)

1. **37** — UX polish على `program/ux-improvements-2` في **DASM-Platform** فقط (بصري).
2. **39–40** — `dasm-inspection-mobile` (API client + شاشات).
3. **41+** — تطبيق migration:
   - انسخ `_proposed/extend_inspection_reports.sql` → `supabase/migrations/{timestamp}_extend_inspection_reports.sql`
   - طبّق عبر Supabase MCP على مشروع **DASM-services** (`bmfqfmsxtotdksvcqfrh`)
   - استخدم `scoring.ts` عند حفظ التقرير لملء `final_score`, `letter_grade`, `auction_track`
4. **بعد مشروع الفحص** — Issue أمني RLS لـ `souq_conversations` / `souq_messages` (خارج نطاق الفحص).

---

## أين تذهب الـ migrations

| التغيير | المستودع / المشروع |
|---------|---------------------|
| `inspection_reports` JSONB + derived columns | **`dasm-inspection`** → `supabase/migrations/` → DB **DASM-services** |
| `marketplace_inspection_reports` UUID FKs | نفس مشروع Supabase **DASM-services** (قد يحتاج PR منسّق في repo الخدمات إن وُجد منفصل) |
| عرض التقرير / تبويب الملف | **DASM-Platform** — استهلاك فقط، بدون migration لـ `inspection_reports` |

---

## عند 41+ — checklist

- [ ] التحقق من Schema JSON مقابل الأعمدة الجديدة
- [ ] تشغيل `scoring.test.ts` — يجب أن تمر كل الحالات (~50)
- [ ] عدم حذف `external_request_id` في نفس PR — عمود legacy؛ حذف لاحقاً
- [ ] صفحة تقرير **واحدة** لـ `direct_sale` و `auction` (`listing_mode`)
- [ ] PR description يذكر `HANDOFF_v2.md` و `cursor_findings_handoff.md`

---

## تحققات Claude (مُسجَّلة)

- أوزان الأقسام = 100
- مثال Camry ≈ 82.8
- EV بدون ناقل حركة: renormalization ≈ 91.2
- TypeScript strict + `noUncheckedIndexedAccess`

---

## ملاحظة `_proposed/`

Supabase CLI يطبّق فقط `supabase/migrations/*_*.sql` بصيغة timestamp. مجلد `_proposed/` **مُتجاهل** — صندوق توصيل آمن حتى يقرر Cursor/محمد النسخ الرسمي.
