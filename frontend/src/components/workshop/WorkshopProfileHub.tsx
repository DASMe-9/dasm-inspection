"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Building2,
  ExternalLink,
  Images,
  Landmark,
  Settings,
  Shield,
} from "lucide-react";
import {
  saveWorkshopKycAction,
  saveWorkshopProfileAction,
} from "@/app/actions/workshop-management";
import { WorkshopShowcaseEditor } from "@/components/workshop/WorkshopShowcaseEditor";
import {
  getDasmProfileSecurityUrl,
  getGrandMarketWorkshopUrl,
} from "@/lib/platform-urls";
import { evaluateWorkshopKyc } from "@/lib/workshop-kyc";
import type { Workshop } from "@/types";

type TabId = "general" | "branding" | "showcase" | "verification" | "security" | "notifications";

const TABS: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "عام", icon: Settings },
  { id: "branding", label: "الورشة", icon: Building2 },
  { id: "showcase", label: "معرض الأعمال", icon: Images },
  { id: "verification", label: "التوثيق والبنك", icon: Landmark },
  { id: "security", label: "الأمان", icon: Shield },
  { id: "notifications", label: "الإشعارات", icon: Bell },
];

export function WorkshopProfileHub({
  workshopId,
  workshopSlug,
  workshop,
}: {
  workshopId: string;
  workshopSlug: string;
  workshop: Workshop;
}) {
  const [tab, setTab] = useState<TabId>("general");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [kycMsg, setKycMsg] = useState<string | null>(null);
  const [profilePending, startProfile] = useTransition();
  const [kycPending, startKyc] = useTransition();

  const kyc = evaluateWorkshopKyc({
    ownerUserId: workshop.ownerUserId,
    commercialRegistration: workshop.commercialRegistration,
    bankIban: workshop.bankIban,
    bankBeneficiaryName: workshop.bankBeneficiaryName,
  });

  const grandMarketUrl = useMemo(
    () => getGrandMarketWorkshopUrl(workshopSlug),
    [workshopSlug],
  );
  const coreProfileUrl = useMemo(() => getDasmProfileSecurityUrl(), []);

  return (
    <div className="space-y-5">
      <section
        className={`rounded-2xl border p-4 text-sm ${
          kyc.complete
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        }`}
      >
        <p className="font-semibold">
          {kyc.complete ? "ملف الورشة مكتمل للتشغيل والصرف" : "أكمل بيانات الورشة (KYC)"}
        </p>
        {!kyc.complete && (
          <p className="mt-1 text-xs">
            المتبقي: {kyc.missing.join(" · ")}
          </p>
        )}
        {!workshop.ownerUserId && (
          <p className="mt-2 text-xs">
            لم يُربط حساب المالك بعد — تأكد أن طلب الانضمام أُرسل بحساب داسم نفسه.
          </p>
        )}
      </section>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex min-w-max gap-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "general" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">نظرة عامة</h2>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-gray-500">اسم الورشة</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{workshop.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">المدينة</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{workshop.city}</dd>
            </div>
            <div>
              <dt className="text-gray-500">الحالة</dt>
              <dd className="flex items-center gap-1 font-semibold text-emerald-700">
                {workshop.isVerified ? (
                  <>
                    <BadgeCheck size={14} />
                    موثّقة
                  </>
                ) : (
                  "بانتظار التوثيق"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">المشاهدات</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {(workshop.viewsCount ?? 0).toLocaleString("ar-SA")}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/workshops/${workshopSlug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              بروفايل inspect
              <ExternalLink size={14} />
            </Link>
            <a
              href={grandMarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
            >
              السوق الكبير
              <ExternalLink size={14} />
            </a>
          </div>
        </section>
      )}

      {tab === "branding" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            البانر والشعار والملف العام
          </h2>
          <form
            className="grid gap-4 md:grid-cols-2"
            action={(fd) => {
              setProfileMsg(null);
              startProfile(async () => {
                const r = await saveWorkshopProfileAction(fd);
                setProfileMsg(r.ok ? "تم حفظ الملف العام." : r.message);
              });
            }}
          >
            <input type="hidden" name="workshop_id" value={workshopId} />
            <input type="hidden" name="workshop_slug" value={workshopSlug} />

            <label className="block md:col-span-2">
              <span className="text-gray-600 dark:text-slate-400">نبذة الورشة</span>
              <textarea
                name="description"
                defaultValue={workshop.description ?? ""}
                className="mt-1 min-h-[96px] w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                placeholder="خبرة الورشة، التخصص، عدد المسارات…"
              />
            </label>
            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">رابط الشعار (URL)</span>
              <input
                name="logo_url"
                defaultValue={workshop.logoUrl ?? ""}
                dir="ltr"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">رابط الغلاف (URL)</span>
              <input
                name="cover_url"
                defaultValue={workshop.coverUrl ?? ""}
                dir="ltr"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">واتساب</span>
              <input
                name="whatsapp"
                defaultValue={workshop.whatsapp ?? ""}
                dir="ltr"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
                placeholder="9665xxxxxxxx"
              />
            </label>
            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">إنستغرام</span>
              <input
                name="instagram"
                defaultValue={workshop.instagram ?? ""}
                dir="ltr"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
                placeholder="@workshop"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-gray-600 dark:text-slate-400">رابط الخريطة</span>
              <input
                name="map_link"
                defaultValue={workshop.mapLink ?? ""}
                dir="ltr"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-gray-600 dark:text-slate-400">ساعات العمل</span>
              <input
                name="working_hours"
                defaultValue={workshop.workingHours ?? ""}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                placeholder="السبت–الخميس 9ص–6م"
              />
            </label>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={workshop.isFeatured}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                إبراز الورشة في الدليل (برنامج/مسابقة)
              </span>
            </label>
            <label className="block md:col-span-2">
              <span className="text-gray-600 dark:text-slate-400">تسمية البرنامج المميز (اختياري)</span>
              <input
                name="featured_program_label"
                defaultValue={workshop.featuredProgramLabel ?? ""}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                placeholder="مثال: مسابقة فحص الشتاء · برنامج الشركاء الذهبي"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={profilePending}
                className="rounded-xl bg-[#1E74E8] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {profilePending ? "جاري الحفظ…" : "حفظ الملف العام"}
              </button>
              {profileMsg && (
                <p className="mt-2 text-xs text-gray-600 dark:text-slate-400" role="status">
                  {profileMsg}
                </p>
              )}
            </div>
          </form>
        </section>
      )}

      {tab === "showcase" && (
        <WorkshopShowcaseEditor
          workshopId={workshopId}
          workshopSlug={workshopSlug}
          galleryUrls={workshop.galleryUrls ?? []}
          repairShowcaseUrls={workshop.repairShowcaseUrls ?? []}
          educationalVideos={workshop.educationalVideos ?? []}
        />
      )}

      {tab === "verification" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            التحقق والصرف (KYC + حساب بنكي)
          </h2>
          <form
            className="grid max-w-lg gap-4"
            action={(fd) => {
              setKycMsg(null);
              startKyc(async () => {
                const r = await saveWorkshopKycAction(fd);
                setKycMsg(r.ok ? "تم حفظ بيانات التحقق." : r.message);
              });
            }}
          >
            <input type="hidden" name="workshop_id" value={workshopId} />
            <input type="hidden" name="workshop_slug" value={workshopSlug} />

            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">السجل التجاري *</span>
              <input
                name="commercial_registration"
                required
                defaultValue={workshop.commercialRegistration ?? ""}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">رقم الآيبان (SA…) *</span>
              <input
                name="bank_iban"
                required
                dir="ltr"
                defaultValue={workshop.bankIban ?? ""}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left font-mono text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="SA00 0000 0000 0000 0000 0000"
              />
            </label>
            <label className="block">
              <span className="text-gray-600 dark:text-slate-400">اسم المستفيد البنكي *</span>
              <input
                name="bank_beneficiary_name"
                required
                defaultValue={workshop.bankBeneficiaryName ?? ""}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            <div>
              <button
                type="submit"
                disabled={kycPending}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
              >
                {kycPending ? "جاري الحفظ…" : "حفظ بيانات التحقق"}
              </button>
              {kycMsg && (
                <p className="mt-2 text-xs text-gray-600 dark:text-slate-400" role="status">
                  {kycMsg}
                </p>
              )}
            </div>
          </form>
        </section>
      )}

      {tab === "security" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">الأمان وكلمة المرور</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            حسابك موحّد عبر منصة داسم الأم. تغيير كلمة المرور، المصادقة الثنائية، وجلسات
            الدخول تُدار من ملفك الشخصي على المنصة الأم — لا نكرّر نظام أمان منفصل هنا.
          </p>
          <a
            href={coreProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16304f]"
          >
            <Shield size={16} />
            فتح الأمان على منصة داسم
            <ExternalLink size={14} />
          </a>
        </section>
      )}

      {tab === "notifications" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">إشعارات الحساب</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            تفضيلات البريد والرسائل النصية للحساب الشخصي تُعدّل من منصة داسم الأم. إشعارات
            طلبات الفحص داخل هذه اللوحة ستُضاف في تحديث لاحق.
          </p>
          <a
            href={coreProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Bell size={16} />
            إعدادات الإشعارات على داسم
            <ExternalLink size={14} />
          </a>
        </section>
      )}
    </div>
  );
}
