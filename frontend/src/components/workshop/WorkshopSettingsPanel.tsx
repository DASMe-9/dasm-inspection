"use client";

import { useState, useTransition } from "react";
import {
  saveWorkshopKycAction,
  saveWorkshopProfileAction,
} from "@/app/actions/workshop-management";
import { WorkshopShowcaseEditor } from "@/components/workshop/WorkshopShowcaseEditor";
import { evaluateWorkshopKyc } from "@/lib/workshop-kyc";
import type { Workshop } from "@/types";

export function WorkshopSettingsPanel({
  workshopId,
  workshopSlug,
  workshop,
}: {
  workshopId: string;
  workshopSlug: string;
  workshop: Workshop;
}) {
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

  return (
    <div className="space-y-8">
      <section
        className={`rounded-2xl border p-4 text-sm ${
          kyc.complete
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
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

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">الملف العام للورشة</h2>
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
            <span className="text-gray-600">نبذة الورشة</span>
            <textarea
              name="description"
              defaultValue={workshop.description ?? ""}
              className="mt-1 min-h-[96px] w-full rounded-lg border px-3 py-2"
              placeholder="خبرة الورشة، التخصص، عدد المسارات…"
            />
          </label>
          <label className="block">
            <span className="text-gray-600">رابط الشعار (URL)</span>
            <input
              name="logo_url"
              defaultValue={workshop.logoUrl ?? ""}
              dir="ltr"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-left"
            />
          </label>
          <label className="block">
            <span className="text-gray-600">رابط الغلاف (URL)</span>
            <input
              name="cover_url"
              defaultValue={workshop.coverUrl ?? ""}
              dir="ltr"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-left"
            />
          </label>
          <label className="block">
            <span className="text-gray-600">واتساب</span>
            <input
              name="whatsapp"
              defaultValue={workshop.whatsapp ?? ""}
              dir="ltr"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-left"
              placeholder="9665xxxxxxxx"
            />
          </label>
          <label className="block">
            <span className="text-gray-600">إنستغرام</span>
            <input
              name="instagram"
              defaultValue={workshop.instagram ?? ""}
              dir="ltr"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-left"
              placeholder="@workshop"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-gray-600">رابط الخريطة</span>
            <input
              name="map_link"
              defaultValue={workshop.mapLink ?? ""}
              dir="ltr"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-left"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-gray-600">ساعات العمل</span>
            <input
              name="working_hours"
              defaultValue={workshop.workingHours ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2"
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
            <span className="text-sm text-gray-700">إبراز الورشة في الدليل (برنامج/مسابقة)</span>
          </label>
          <label className="block md:col-span-2">
            <span className="text-gray-600">تسمية البرنامج المميز (اختياري)</span>
            <input
              name="featured_program_label"
              defaultValue={workshop.featuredProgramLabel ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2"
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
              <p className="mt-2 text-xs text-gray-600" role="status">
                {profileMsg}
              </p>
            )}
          </div>
        </form>
      </section>

      <WorkshopShowcaseEditor
        workshopId={workshopId}
        workshopSlug={workshopSlug}
        galleryUrls={workshop.galleryUrls ?? []}
        repairShowcaseUrls={workshop.repairShowcaseUrls ?? []}
        educationalVideos={workshop.educationalVideos ?? []}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">التحقق والصرف (KYC)</h2>
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
            <span className="text-gray-600">السجل التجاري *</span>
            <input
              name="commercial_registration"
              required
              defaultValue={workshop.commercialRegistration ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-gray-600">رقم الآيبان (SA…) *</span>
            <input
              name="bank_iban"
              required
              dir="ltr"
              defaultValue={workshop.bankIban ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-left font-mono text-sm"
              placeholder="SA00 0000 0000 0000 0000 0000"
            />
          </label>
          <label className="block">
            <span className="text-gray-600">اسم المستفيد البنكي *</span>
            <input
              name="bank_beneficiary_name"
              required
              defaultValue={workshop.bankBeneficiaryName ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>

          <div>
            <button
              type="submit"
              disabled={kycPending}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {kycPending ? "جاري الحفظ…" : "حفظ بيانات التحقق"}
            </button>
            {kycMsg && (
              <p className="mt-2 text-xs text-gray-600" role="status">
                {kycMsg}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
