"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  Camera,
  ExternalLink,
  Images,
  Landmark,
  MapPin,
  Palette,
  Shield,
} from "lucide-react";
import {
  saveWorkshopKycAction,
  saveWorkshopProfileAction,
} from "@/app/actions/workshop-management";
import { WorkshopNavPreferencesPanel } from "@/components/workshop/WorkshopNavPreferencesPanel";
import { WorkshopLocationFields } from "@/components/workshop/WorkshopLocationFields";
import { WorkshopMediaUploadField } from "@/components/workshop/WorkshopMediaUploadField";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";
import { parseHiddenNavKeys } from "@/lib/auth/workshop-nav-preferences";
import { WorkshopShowcaseEditor } from "@/components/workshop/WorkshopShowcaseEditor";
import { getDasmProfileSecurityUrl } from "@/lib/platform-urls";
import { evaluateWorkshopKyc } from "@/lib/workshop-kyc";
import type { Workshop } from "@/types";
import { useRouter } from "next/navigation";

type TabId =
  | "branding"
  | "showcase"
  | "verification"
  | "security"
  | "notifications"
  | "appearance";

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "branding", label: "البروفايل والشعار", icon: Building2 },
  { id: "showcase", label: "معرض الأعمال", icon: Images },
  { id: "verification", label: "التوثيق", icon: Landmark },
  { id: "security", label: "الأمان", icon: Shield },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "appearance", label: "المظهر", icon: Palette },
];

function tabButtonClass(active: boolean) {
  return [
    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition",
    active
      ? "bg-[#1E74E8] text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  ].join(" ");
}

function initialTabFromHash(): TabId {
  if (typeof window === "undefined") return "branding";
  const hash = window.location.hash.replace(/^#/, "");
  if ((TABS as { id: string }[]).some((t) => t.id === hash)) {
    return hash as TabId;
  }
  return "branding";
}

export function WorkshopProfileHub({
  workshopId,
  workshopSlug,
  workshop,
  embeddedInSettings = false,
}: {
  workshopId: string;
  workshopSlug: string;
  workshop: Workshop;
  /** عند الدمج داخل /settings — بدون شريط عودة منفصل */
  embeddedInSettings?: boolean;
}) {
  const [tab, setTab] = useState<TabId>("branding");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [kycMsg, setKycMsg] = useState<string | null>(null);
  const [profilePending, startProfile] = useTransition();
  const [kycPending, startKyc] = useTransition();
  const [logoUrl, setLogoUrl] = useState(workshop.logoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(workshop.coverUrl ?? "");
  const router = useRouter();

  useEffect(() => {
    setTab(initialTabFromHash());
  }, []);

  useEffect(() => {
    setLogoUrl(workshop.logoUrl ?? "");
    setCoverUrl(workshop.coverUrl ?? "");
  }, [workshop.logoUrl, workshop.coverUrl]);

  const kyc = evaluateWorkshopKyc({
    ownerUserId: workshop.ownerUserId,
    commercialRegistration: workshop.commercialRegistration,
    bankIban: workshop.bankIban,
    bankBeneficiaryName: workshop.bankBeneficiaryName,
  });

  const coreProfileUrl = useMemo(() => getDasmProfileSecurityUrl(), []);
  const dashboardHref = `/workshop?workshop_id=${workshopId}`;

  const visibleTabs = embeddedInSettings
    ? TABS
    : TABS.filter((t) => t.id !== "appearance");

  function selectTab(next: TabId) {
    setTab(next);
    if (typeof window !== "undefined" && embeddedInSettings) {
      window.history.replaceState(null, "", `#${next}`);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {!embeddedInSettings ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            لوحة تشغيل الورشة
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة ملف الورشة — منفصل عن لوحة المعرض على منصة داسم الأم
          </p>
        </div>
      ) : null}

      {/* ── غلاف + شعار (نمط المعرض) ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative h-40 bg-gradient-to-br from-[#0B1E3A] to-[#1E3A5F] md:h-48">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-300">
              <Camera className="mb-2 h-8 w-8 opacity-70" aria-hidden />
              <p className="text-xs">أضف صورة الغلاف من تبويب «البروفايل والشعار»</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="relative px-5 pb-5 pt-0 md:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md dark:border-slate-900 dark:bg-slate-800">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-9 w-9 text-[#1E74E8]" aria-hidden />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                  {workshop.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {workshop.city}
                  </span>
                  {workshop.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      موثّقة
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      بانتظار التوثيق
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!kyc.complete && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">أكمل ملف الورشة والتحقق (KYC)</p>
          <p className="mt-1 text-xs">
            المتبقي: {kyc.missing.join(" · ")} —{" "}
            <button
              type="button"
              onClick={() => selectTab("verification")}
              className="font-semibold underline"
            >
              انتقل إلى التوثيق
            </button>
          </p>
          {!workshop.ownerUserId && (
            <p className="mt-2 text-xs">
              لم يُربط حساب المالك بعد — تأكد أن طلب الانضمام أُرسل بحساب داسم نفسه.
            </p>
          )}
        </section>
      )}

      <nav
        className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        aria-label="أقسام إعدادات الورشة"
      >
        <div className="flex min-w-max gap-1">
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={tabButtonClass(tab === item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-6">
        {tab === "branding" && (
          <div className="space-y-5">
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
                <span className="text-sm text-slate-600 dark:text-slate-400">نبذة الورشة</span>
                <textarea
                  name="description"
                  defaultValue={workshop.description ?? ""}
                  className="mt-1 min-h-[96px] w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  placeholder="خبرة الورشة، التخصص، عدد المسارات…"
                />
              </label>
              <WorkshopMediaUploadField
                workshopId={workshopId}
                workshopSlug={workshopSlug}
                kind="logo"
                label="الشعار"
                value={logoUrl}
                onUploaded={(url) => {
                  setLogoUrl(url);
                  router.refresh();
                }}
              />
              <WorkshopMediaUploadField
                workshopId={workshopId}
                workshopSlug={workshopSlug}
                kind="cover"
                label="صورة الغلاف"
                value={coverUrl}
                onUploaded={(url) => {
                  setCoverUrl(url);
                  router.refresh();
                }}
              />
              <label className="block">
                <span className="text-sm text-slate-600 dark:text-slate-400">واتساب</span>
                <input
                  name="whatsapp"
                  defaultValue={workshop.whatsapp ?? ""}
                  dir="ltr"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
                  placeholder="9665xxxxxxxx"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-600 dark:text-slate-400">إنستغرام</span>
                <input
                  name="instagram"
                  defaultValue={workshop.instagram ?? ""}
                  dir="ltr"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800"
                  placeholder="@workshop"
                />
              </label>
              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <WorkshopLocationFields
                  initialNationalAddress={workshop.nationalAddressCode}
                  initialMapLink={workshop.mapLink}
                />
              </div>
              <label className="block md:col-span-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">ساعات العمل</span>
                <input
                  name="working_hours"
                  defaultValue={workshop.workingHours ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
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
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  إبراز الورشة في الدليل (برنامج/مسابقة)
                </span>
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
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400" role="status">
                    {profileMsg}
                  </p>
                )}
              </div>
            </form>
          </div>
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
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                التوثيق والتحقق (KYC + حساب بنكي)
              </h2>
            </div>
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
                <span className="text-sm text-slate-600 dark:text-slate-400">السجل التجاري *</span>
                <input
                  name="commercial_registration"
                  required
                  defaultValue={workshop.commercialRegistration ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-600 dark:text-slate-400">رقم الآيبان (SA…) *</span>
                <input
                  name="bank_iban"
                  required
                  dir="ltr"
                  defaultValue={workshop.bankIban ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm text-left dark:border-slate-600 dark:bg-slate-800"
                  placeholder="SA00 0000 0000 0000 0000 0000"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-600 dark:text-slate-400">اسم المستفيد البنكي *</span>
                <input
                  name="bank_beneficiary_name"
                  required
                  defaultValue={workshop.bankBeneficiaryName ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                />
              </label>

              <div>
                <button
                  type="submit"
                  disabled={kycPending}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                >
                  {kycPending ? "جاري الحفظ…" : "حفظ بيانات التحقق"}
                </button>
                {kycMsg && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400" role="status">
                    {kycMsg}
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">الأمان وكلمة المرور</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              حسابك موحّد عبر منصة داسم الأم. تغيير كلمة المرور، المصادقة الثنائية، وجلسات
              الدخول تُدار من ملفك الشخصي على المنصة الأم — لا نكرّر نظام أمان منفصل هنا.
            </p>
            <a
              href={coreProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16304f]"
            >
              <Shield className="h-4 w-4" aria-hidden />
              فتح الأمان على منصة داسم
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">إشعارات الحساب</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              تفضيلات البريد والرسائل النصية للحساب الشخصي تُعدّل من منصة داسم الأم. إشعارات
              طلبات الفحص داخل هذه اللوحة ستُضاف في تحديث لاحق.
            </p>
            <a
              href={coreProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4" aria-hidden />
              إعدادات الإشعارات على داسم
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        )}

        {tab === "appearance" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">المظهر</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                الوضع الداكن أو الفاتح، وتخصيص عناصر الشريط الجانبي.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                الوضع الداكن / الفاتح
              </span>
              <ThemeToggle className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700" />
            </div>
            <WorkshopNavPreferencesPanel
              workshopId={workshopId}
              hiddenNavKeys={parseHiddenNavKeys(workshop.sidebarHiddenNavKeys) as InspectionNavKey[]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
