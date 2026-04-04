# V1 Scope — خدمة فحص الورش (dasm-inspection)

هذا المستودع **مخصص لفحص الورش فقط**. الشحن والتسليم والناقلون ومسارات ما بعد الاعتماد تُدار في **مستودع مستقل** ولا تُخزَّن ولا تُعرَض هنا.

## حدود المجال (جداول Postgres، بادئة `inspection_`)

| كيان منطقي | جدول |
|------------|------|
| workshops | `inspection_workshops` |
| inspectors | `inspection_inspectors` |
| inspection_requests | `inspection_requests` |
| inspection_reports | `inspection_reports` |
| inspection_report_items | `inspection_report_items` |
| inspection_attachments | `inspection_attachments` |
| inspection_status_history | `inspection_status_history` |

**inspection_checklists:** غير موجود كجدول في V1؛ واجهة «قائمة الفحص» الحالية (`ChecklistForm`) مسودة ويمكن ربطها لاحقاً بقالب بنود أو بجدول قوائم منفصل في نفس المستودع عند الحاجة.

## الأدوار

**في قاعدة البيانات اليوم (`inspection_app_role`):** `super_admin`, `inspection_admin`, `workshop_manager`, `inspector`, `viewer`.

**المعتمدة لمنتج DASM (مصدر الهوية المنصة، ليس نظام auth محلي):** `inspection_admin`, `workshop_owner`, `mechanic`, `inspector`, `dasm_user` — مع **محاذاة تدريجية** في Phase 2 (انظر [`permissions-matrix.md`](./permissions-matrix.md)).

## المسارات

| Path | الغرض |
|------|--------|
| `/` | لوحة تحكم |
| `/requests` | قائمة الطلبات |
| `/requests/:id` | تفاصيل، إسناد، خط زمني، مرفقات، اعتماد/رفض |
| `/reports/:id` | تقرير + بنود |
| `/workshops` | قائمة الورش |
| `/workshops/:id` | ملف ورشة + مفتشون |
| `/settings` | أدوار وتكامل (نصي) |

## سير العمل المُنفَّذ (Supabase)

1. إنشاء طلب (`submitted`) من نموذج الطلبات  
2. إسناد ورشة + مفتش (`assigned`)  
3. بدء الفحص (`in_progress`)  
4. تقديم تقرير + بنود (`pending_review`)  
5. **نهاية المسار في هذا الريبو:** اعتماد التقرير (`approved`) أو رفضه (`rejected`)، أو إلغاء الطلب (`cancelled` عند دعمه في المنتج)

لا توجد **أي** Server Actions أو جداول بعد `approved` / `rejected` داخل هذا المستودع.  
مصطلح **completed** في لغة المنتج يُقصد به غالباً «إغلاق ناجح للفحص» ويُمثَّل هنا بحالة **`approved`** (لا حالة `completed` منفصلة في مخطط V1 الحالي).

## خارج النطاق

- الشحن، التسليم، الناقل، التتبع، وأي حالات مثل `in_transit` / `delivered` لهذا المجال.  
- مصادقة مستخدم نهائية كاملة على الواجهة (V1 يستخدم مفتاح خدمة على الخادم)، رفع ملفات فعلي، إشعارات، تطبيق عميل مزادات منفصل.
