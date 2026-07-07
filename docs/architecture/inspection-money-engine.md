# محرّك المال للفحص (إسكرو + عمولة + صرف) — مخطّط التنفيذ

> وثيقة تصميم. الحالة: **مقترح — بانتظار موافقة المالك قبل كتابة كود المال.**
> آخر تحديث: 2026-07-07. القرارات مؤكّدة من المالك.

## القرارات المؤكّدة (المالك)
- **العمولة:** 20% للمنصّة، 80% للورشة.
- **نافذة الإسكرو:** أسبوع (سقف احتجاز).
- **مُحفّز الصرف:** عند **اعتماد التقرير**.
- **طريقة الصرف:** إلى **IBAN** الورشة.

## الوضع الحالي (بالأدلّة)
- **محرّك الإسكرو مبنيّ وعامّ على Core (Laravel):** `EscrowService::hold/release/refund` + جدول `escrow_transactions` + `config/escrow.php`. لكنّه **لا يُستدعى من أي تدفّق** في المنصّة (نائم).
- **دفع الفحص عبر PayMob يعمل:** `InspectionRequestFeePayController::checkout/webhook`. عند النجاح يستدعي `RecordInspectionServicePaymentAction` بـ`debit=false` → يسجّل «رسوم إدارية» (**100% للمنصّة، الورشة تأخذ صفراً**) + يحدّث حالة الدفع على صف `inspection_requests` (Supabase services) عبر PATCH.
- **الاعتماد يقع في تطبيق الفحص** (Next.js/Supabase services): `executeApproveInspectionReport` — **نظام منفصل عن Core** حيث يعيش الإسكرو.
- **فجوات البيانات:** `inspection_workshops` **لا يحوي** `owner_user_id` ولا `bank_iban` ولا اسم المستفيد → لا ربط ورشة→مستخدم Core (payee) ولا IBAN.
- **رصيف الصرف البنكي (stc) مؤجَّل** (`project_stc_payout_integration` ⏸️) → لا صرف بنكي آليّ حيّ بعد.

## التعقيدات المحلولة في التصميم
1. **PayMob مقابل خصم المحفظة:** `EscrowService::hold()` يخصم من **محفظة** الدافع، لكن رسوم الفحص تأتي من **بطاقة PayMob** لا من رصيد محفظة. الحل: عند نجاح webhook، **نُودِع مبلغ الرسوم في محفظة العميل** (إثبات دخول المال) **ثم `hold()`** يخصمه إلى الإسكرو — يبقى القيد المزدوج متوازناً وقابلاً للتدقيق.
2. **عبور الأنظمة:** الاعتماد في تطبيق الفحص، والإسكرو في Core. الحل: نقطة داخلية جديدة على Core `POST /api/internal/dasm-inspection/escrow/release` (محميّة بـ`X-DASM-Internal-Token` كبقية الجسر) يستدعيها تطبيق الفحص عند الاعتماد.
3. **مستفيد الورشة:** الـpayee = مستخدم Core المالك للورشة. يلزم إضافة `owner_user_id` (أو استخدام `dasm_partner_ref`) للورشة.
4. **الصرف إلى IBAN:** `release()` يودع **محفظة الورشة الداخلية** 80%. الصرف البنكي إلى IBAN = **سجلّ صرف (payout) بحالة pending** يحمل IBAN + اسم المستفيد، يُنفَّذ يدويًّا (أو عبر رصيف stc عند تفعيله). لا صرف بنكي آليّ يُدّعى قبل جاهزية الرصيف.

## التدفّق المستهدف
```
العميل يدفع (PayMob) → webhook نجاح
   → إيداع محفظة العميل بالمبلغ (money-in)
   → EscrowService::hold(payer=العميل, platform='inspection', rate=0.20, reference=inspection_request_id) [HELD]
   → PATCH حالة الطلب: fee_payment=paid + escrow=held

الفاحص يفحص → الورشة/الأدمن يعتمد التقرير (تطبيق الفحص)
   → تطبيق الفحص ينادي Core: POST /api/internal/dasm-inspection/escrow/release {inspection_request_id}
   → Core: يجد الإسكرو HELD لهذا الطلب
   → EscrowService::release(escrow, payee=مستخدم الورشة)
        → محفظة الورشة += 80%  ·  عمولة المنصّة 20% تُسجَّل بالليدجر
   → إنشاء سجلّ صرف payout (pending) بـ IBAN الورشة + المبلغ الصافي
   → PATCH حالة الطلب: escrow=released

(احتياط) إن لم يُعتمد خلال أسبوع → قرار المالك لاحقاً: refund للعميل أو تمديد. (خارج نطاق أول تسليم.)
```

## المراحل (PRs مرحلية، كلّ منها بأدلّة + اختبارات حُرّاس + مراجعة الحارس المالي)
| # | المرحلة | المخاطر | التسليم |
|---|---|---|---|
| 1 | **الأساس:** ضبط العمولة 20% (`config/escrow.php` + env `ESCROW_COMMISSION_INSPECTION=0.20`) · إضافة `owner_user_id`+`bank_iban`+`bank_beneficiary_name` للورشة · التقاطها في نموذج الانضمام/الاعتماد | منخفض (لا حركة مال) | migration + config + نموذج |
| 2 | **الحجز:** عند webhook نجاح → إيداع محفظة العميل ثم `hold()` (platform=inspection, rate=0.20) + وسم الطلب escrow=held | **عالٍ (مال)** | تعديل `InspectionRequestFeePayController` + اختبارات |
| 3 | **الإطلاق:** نقطة `POST /api/internal/.../escrow/release` + استدعاؤها من `executeApproveInspectionReport` عند الاعتماد → release 80/20 | **عالٍ (مال)** | نقطة Core + جسر + اختبارات |
| 4 | **صرف IBAN:** جدول `inspection_workshop_payouts` (pending/paid) + إنشاء سجلّ عند الإطلاق + شاشة أدمن للتنفيذ | متوسط | جدول + شاشة |
| 5 | **ماليّة الورشة:** صفحة رصيد + أرباح + سجلّ صرف (ويب) ثم شاشة جوال | متوسط | ويب + جوال |
| 6 | **مرآة الجوال:** نقاط `/api/mobile/...` + شاشات Flutter لكلٍّ ← بناء Codemagic | متوسط | Flutter |

## بوابات الأمان (إلزامية قبل كل دمج مالي)
- مراجعة **حارس السلامة المالية** (dasm-financial-integrity-sentinel): الليدجر مقابل المحافظ، العمولة عبر Resolver، idempotency، الوحدات (هللة/ريال).
- **idempotency:** الحجز مرّة واحدة لكل payment_ref؛ الإطلاق مرّة واحدة لكل escrow (release يرفض غير HELD أصلاً ✅).
- اختبارات TDD للحساب (20/80، التقريب، الحدود) قبل الدمج.
- الوحدات: `Wallet` بالريال · `ExhibitorWallet` بالهللة — الانتباه للسياق.

## 🔴 حُرّاس إلزامية (من مراجعة حارس السلامة المالية 2026-07-07)
تُطبَّق قبل/أثناء المراحل المالية — بلا استثناء:
1. **منع ازدواج التسجيل:** عند تفعيل الإسكرو في المرحلة 2، **يُستبدَل** استدعاء `RecordInspectionServicePaymentAction` القديم (يسجّل 100% كرسوم إدارية) بتدفّق الإسكرو في نفس نقطة الـwebhook — لا يعملان معاً لنفس `payment_ref`. أي سجلّ إيراد للتحليلات يبقى **إعلاميّاً بلا حركة محفظة** وبنوع مختلف عن `ADMIN_FEE_COLLECTED`.
2. **idempotency للحجز:** قيد فريد `UNIQUE(reference)` على `escrow_transactions` + فحص `exists(reference)` داخل `DB::transaction` في `EscrowService::hold()` نفسها (يخدم كل المنصّات)، ويرمي «محجوز مسبقاً» بدل التكرار. نقطة `/escrow/release` تلتقط استثناء «غير HELD» وتُرجعه نجاحاً idempotent (`already_released`) لا 500.
3. **محفظة الورشة صريحة:** الصرف عبر `WalletService::creditGeneralWalletOnly` (ريال) لا عبر الفرع العام — يمنع تسرّب مستحقات الفحص إلى `ExhibitorWallet` بالهللة إن كان المالك `venue_owner`. + اختبار حارس.
4. **العمولة من config فقط:** لا تُمرَّر `commissionRate` رقماً عند الاستدعاء (اترك `null`) — المصدر `config('escrow.commission_rates.inspection')` وحده. + اختبار يربط env بالنتيجة.
5. **رصد الإطلاق عابر الأنظمة:** عمود `escrow_release_status/attempts/error` (نمط `core_sync_status` المُختبَر) + دالة retry — الاعتماد ماليّاً ناجح فقط عند حالة `released` فعلية في Core. مصادقة `/escrow/release` عبر `VerifyDasmInspectionInternalPullToken` القائم (لا middleware موازٍ).
6. **اختبار كسور الهللة:** مبالغ مثل 33.33 و100.01 تُثبت `commission + net == amount` دائماً (الصافي = الباقي، لا حساب مستقل).
7. **توفيق `owner_user_id`:** هجرة `..._inspection_workshops_owner_user_id.sql` موجودة بالريبو لكن العمود **غير مطبّق** على DASM-services الحيّ — يُطبَّق/يُوفَّق في المرحلة 1، ويُحسم نوع مستخدم المالك (يُفضَّل `user`/`dealer` لا `venue_owner`).

## القرار المطلوب
اعتماد هذا المخطّط (بعد التحصينات) + الإذن ببدء **المرحلة 1 (الأساس، بلا حركة مال):** توفيق `owner_user_id` + إضافة `bank_iban`/`bank_beneficiary_name` + ضبط العمولة 20% (config + env) + قيد `UNIQUE(reference)`. ثم المراحل المالية (2-3) تُراجَع بالحارس وتُعرض أدلّتها قبل كل دمج.
