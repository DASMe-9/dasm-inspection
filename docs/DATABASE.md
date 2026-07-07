# داسم فحص — Database Architecture

> ⛔ **مهمل (DEPRECATED) — لا تعتمد على هذا الملف.**
> كان يصف معمارية قديمة لم تعد قائمة: جداول `car_inspection_reports` / `car_report_images` /
> `marketplace_inspection_requests` ونماذج Laravel (`CarInspectionReport.php`) على DASM-Platform.
> **الواقع الحالي:** التطبيق Next.js + Supabase (Server Actions + service_role)، والجداول هي
> عائلة `inspection_*` (طلبات/تقارير/بنود/ورش/مفتشون…) على مشروع **DASM-services**
> (`bmfqfmsxtotdksvcqfrh`) — لا نماذج Laravel للفحص.
>
> **مصادر الحقيقة الحالية:**
> - خريطة الريبو الكاملة: [`architecture/dasm-inspection-repo-map.md`](./architecture/dasm-inspection-repo-map.md) (+ `.html`)
> - نموذج المجال: [`domain-model.md`](./domain-model.md)
> - المخطّط الفعلي: `supabase/migrations/*.sql`
>
> يُحفظ هذا الملف كأثر تاريخي فقط؛ يُحذف لاحقًا بعد التأكّد من عدم وجود مراجع خارجية إليه.

---

## (تاريخي — غير دقيق)

المحتوى القديم كان يفترض خلفية Laravel للفحص عبر `pgsql_services` بجداول `car_inspection_reports`.
تلك المقاربة استُبدلت بمعمارية Supabase المباشرة في هذا الريبو. راجع المصادر أعلاه.
