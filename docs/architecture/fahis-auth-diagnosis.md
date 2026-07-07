# تشخيص عطل مصادقة تطبيق الفاحص (فحص داسم) — صفحة واحدة

> **تشخيص فقط (2026-07-08). لا إصلاح، لا تغيير بيئة، لا دمج.** مبنيّ على إعادة إنتاج حيّة.

## 🔴 تحديث حاسم — تركيز Build 9 (2026-07-08، بعد اعتراض المالك)
اعتراض المالك صحيح: إعادة إنتاجي أثبتت أنّ الباكند يقبل توكناً **جديداً**، لا ما يرسله Build 9. التحقيق المركّز:
- **Build 9 = branch `main`, commit `77df4c4`** (بعد دمج #15، بناء Codemagic 07-07 08:03). **حديث، لا stale.**
- **إعداد Build 9 صحيح** (`app_config` عند 77df4c4): `platformApiBase=api.dasm.com.sa/api`, `inspectionWebBase=inspect.dasm.com.sa`. تدفّق `/login` → `/user/profile` → Bearer — مطابق للعامل. **⇒ فرضية «كود قديم/نقطة خاطئة» مستبعَدة.**
- **زرّ logout موجود** في Build 9 (شريط لوحة القيادة). الـinterceptor يُرفق التوكن المخزَّن **لكن بلا أي معالجة 401 ولا تجديد**.
- **الدليل القاطع:** Core `config/sanctum.php` → **`expiration => 120` (ساعتان)**. توكن Sanctum ينتهي بعد ساعتين. Core فيه `RefreshAccessTokenAction` (تجديد مدعوم) لكن **Build 9 لا يستدعيه**.

### الحكم بمستويات الثقة
| الفرضية | الثقة | الأساس | أرخص اختبار حاسم |
|---|---|---|---|
| **(أ) توكن منتهٍ لم يجدّده التطبيق** | **عالية (شبه مؤكّد)** | Sanctum ينتهي بعد **ساعتين** · Build 9 بلا تجديد/معالجة 401 · توكن جديد (curl) يعمل 200. المالك فتح التطبيق بعد ساعتين+ من آخر دخول → توكن منتهٍ → خطأ دائم. | **إعادة دخول على Build 9** (أدناه): يعمل فوراً ثم يفشل ثانيةً بعد ساعتين. |
| **(ب) Build 9 من كود قديم / نقطة أو صيغة خاطئة** | **مستبعَدة (شبه صفر)** | إعداد 77df4c4 صحيح تماماً (نطاقات + نقاط + Bearer) مطابق للعامل. | لا يلزم — مُكذَّبة بالمصدر. |
| **(ج) عطل تخزين/إرفاق توكن خاصّ بـBuild 9** | **منخفضة** | منطق الـinterceptor قياسي (يقرأ التخزين ويُرفق). | نفس اختبار إعادة الدخول: لو فشل **بعد دخول جديد فوريّ** على Build 9 → (ج). |

### 🔑 التعليمة الواحدة للمالك (اختبار حاسم، بسيط)
> «في التطبيق: افتح **الرئيسية**، اضغط أيقونة **الخروج** (أعلى، تسجيل الخروج)، ثم **سجّل الدخول من جديد** بـ`inspector@dasm.com.sa` / `Pass@123`. هل تُحمَّل **طلباتي المُسنَدة** بعدها؟ نعم/لا»
- **نعم** → تأكّد الجذر (أ): توكن منتهٍ. **ملاحظة:** سيعمل الآن لكن **سيتعطّل ثانيةً بعد ساعتين** حتى يُضاف تجديد التوكن.
- **لا (رغم دخول جديد فوريّ)** → الجذر (ج): عطل تخزين/إرفاق في Build 9 — يحتاج فحصاً أعمق.

### الإصلاح المشترك الواحد (لا تنفيذ الآن)
جذر (أ) + عطل «اللوحة المتقدمة» يحلّهما **تبنّي التطبيق لمسار SSO الموجود**: `SsoController::verify` يُصدر **جلسة 30 يوماً** (بدل ساعتين) — عمر أطول للتطبيق **و**تسليم ويب عبر `gateway?token=`. بديل أدنى: إضافة تجديد التوكن (`RefreshAccessTokenAction`) + معالجة 401 → إعادة دخول. **الباكند جاهز؛ العمل Flutter.**

---

## الحقيقة الحاسمة (إعادة إنتاج حيّة)
بحساب `inspector@dasm.com.sa` (user **319**, type=user, `inspection_role=inspector`):
- `POST api.dasm.com.sa/api/login` → توكن Sanctum ✓
- `GET api.dasm.com.sa/api/user/profile` → id=319, inspection_role=**inspector** ✓ (UserController على master يُرجعه — #2664 حيّ)
- `GET inspect.dasm.com.sa/api/mobile/requests` → **HTTP 200** + الطلبات الثلاثة + `scope=inspector, role=inspector` ✓

**⇒ سلسلة المصادقة الخلفية سليمة الآن. لا كسر إعداد في الإنتاج.**

## الجذر لكل عرض
| العرض | الجذر (مؤكّد) |
|---|---|
| **(i) «Platform token rejected and JWT verifier is not configured»** على «طلباتي المُسنَدة» | **توكن التطبيق منتهٍ/قديم**، لا كسر باكند. المسار: `authenticateDasmToken` (`authenticate-dasm-token.ts:33-46`) يجرّب JWT أولاً → يعيد `code:"config"` (لأنّ `DASM_JWT_ISSUER/SECRET/JWKS` **غير مضبوطة على Vercel** — فقط `DASM_JWT_ENFORCE` موجود)، ثم يجرّب `verifyDasmUserToken` (`/api/user/profile`) → **null لأنّ توكن التطبيق مرفوض من Core (منتهٍ)**. حينها تُدمَج الرسالتان في نصّ **مضلّل** (السطر 44): يذكر «JWT not configured» رغم أنّ السبب الفعليّ = التوكن المنتهي. **التطبيق لا يجدّد التوكن ولا يفرض إعادة دخول عند 401** (`inspection_auth_service.dart` يخزّن التوكن ويعيد استخدامه). |
| **(ii) «اللوحة المتقدمة» تطلب دخولاً جديداً** | **تسليم الجلسة app→web غير موصول.** `home_screen.dart:_openWeb` يفتح `inspect.dasm.com.sa/requests` **URL عارٍ بلا `?token=`**. بنية SSO موجودة وجاهزة على الطرفين لكنها لا تُستدعى: `SsoController::generate` (backend) يدعم `platform='inspection'` (ALLOWED_PLATFORMS + scopes inspection:read/write, reports:read/write) → توكن SSO 5 دقائق → `/api/gateway?token=` على الويب يضبط الكوكيز. **التطبيق لا يستدعي `/api/sso/generate` قبل فتح الويب.** |
| **(iii) نقاط غير المصادقة تعمل** (دليل الورش) | لأنها لا تمرّ بـ`authenticateDasmToken` أصلاً. متّسق مع أنّ العطل مصادقة-توكن لا شبكة. |

## الإصلاح المشترك الواحد (يخدم التطبيق والويب معاً)
**تبنّي مسار SSO الموجود بدل توكن /api/login المباشر:** التطبيق يستدعي `POST /api/sso/generate {platform:"inspection"}` بعد الدخول →
- **للتطبيق:** يستخدم توكن الجلسة الأطول عمراً (SsoController::verify يُصدر جلسة 30 يوماً) + يفرض إعادة دخول عند 401 → يزيل عطل (i).
- **للويب:** يفتح «اللوحة المتقدمة» عبر `inspect.dasm.com.sa/api/gateway?token=<sso>` → جلسة ويب تلقائية → يزيل عطل (ii).
- **مصدر واحد للتوكن + آلية تسليم واحدة** = إصلاح واحد لا اثنان.
- **الباكند جاهز** (SsoController + gateway + sso-callback). العمل الأساسي **على التطبيق (Flutter)** + تحسين رسالة الخطأ في `authenticate-dasm-token.ts` (فصل «توكن مرفوض» عن «JWT غير مُعَدّ»).

## الملفات/المتغيّرات المتأثّرة
- **Flutter (الأساس):** `lib/auth/inspection_auth_service.dart` (تبديل لـ`/api/sso/generate` + تجديد/إعادة دخول عند 401)، `lib/features/home/home_screen.dart:_openWeb` (فتح عبر gateway?token=).
- **الويب (تحسين رسالة فقط):** `dasm-inspection/frontend/src/lib/auth/authenticate-dasm-token.ts:42-46` (رسالة أدقّ).
- **بيئة (اختياري، ليس سبب العطل):** إن أُريد مسار JWT مباشر لاحقاً → ضبط `DASM_JWT_ISSUER`+`DASM_JWT_SECRET/JWKS_URI` على Vercel. **حالياً `DASM_JWT_ENFORCE` مضبوط بقيمة مشفّرة (القيمة غير مقروءة عبر API — تحتاج تأكيد لوحة Vercel: يجب أن تكون `false` ما دام JWT غير مُعَدّ، وإلا الوسيط قد يفرض verifier غائباً).**

## نطاق الانفجار
- **`/api/sso/generate` و`SsoController` مشتركان مع منصّات أخرى** (shipping, investor, control-room, nalp, ads…). تبنّي التطبيق لمسار SSO **لا يعدّل SsoController** (يستهلكه فقط بـ`platform=inspection` المسموح مسبقاً) → **صفر مساس بأنواع مستخدمين أخرى.**
- تحسين رسالة `authenticate-dasm-token.ts` يمسّ مسار مصادقة الفحص فقط (`/api/mobile/*` + وسيط الويب) — لا يمسّ dealer/venue_owner/investor.
- **لا يلمس الإصلاح كود مصادقة مشترك حسّاس** (authStore، /api/login، /api/user/profile تبقى كما هي).

## خطة الإصلاح (خطوات ببوابات موافقة — لا تنفيذ الآن)
1. **تأكيد قيمة `DASM_JWT_ENFORCE` على Vercel** (لوحة) + ضبطها `false` إن لزم (بيئة، بوابة منفصلة).
2. **تحسين رسالة الخطأ** (ويب، PR صغير) — فصل «توكن مرفوض/منتهٍ» عن «JWT غير مُعَدّ» + توجيه لإعادة الدخول.
3. **التطبيق: تبنّي SSO + معالجة 401** — `sso/generate` بعد الدخول + إعادة دخول عند الرفض (Flutter PR → Codemagic).
4. **التطبيق: «اللوحة المتقدمة» عبر gateway?token=** (Flutter PR → Codemagic).
كلٌّ ببوابته (أدلّة → موافقة → دمج).
