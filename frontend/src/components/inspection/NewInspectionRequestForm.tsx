"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInspectionRequestAction } from "@/app/actions/inspection-workflow";
import { WorkshopPricingBadges } from "@/components/inspection/WorkshopPricingBadges";
import { useTheme } from "@/hooks";
import { formatInspectionPriceSar } from "@/lib/inspection-pricing";
import type {
  InspectionServiceMode,
  Workshop,
  WorkshopServicePricing,
} from "@/types";

export type CreateRequestWorkshopOption = Pick<
  Workshop,
  "id" | "name" | "city" | "isVerified" | "pricing"
>;

export function NewInspectionRequestForm({
  defaultDasmUserId,
  defaultDasmCarId,
  defaultVehicleLabel,
  defaultTitle,
  defaultPreferredWorkshopId,
  platformPricing,
  workshops = [],
}: {
  defaultDasmUserId?: string;
  /** Core cars.id — when set, request links to existing car (no minimal-car). */
  defaultDasmCarId?: string;
  defaultVehicleLabel?: string;
  defaultTitle?: string;
  defaultPreferredWorkshopId?: string;
  platformPricing?: WorkshopServicePricing | null;
  workshops?: CreateRequestWorkshopOption[];
}) {
  const { colors } = useTheme({ role: "workshop" });
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [preferredWorkshopId, setPreferredWorkshopId] = useState(() => {
    const requested = (defaultPreferredWorkshopId ?? "").trim();
    return workshops.some((w) => w.isVerified && w.id === requested)
      ? requested
      : "";
  });
  const [serviceMode, setServiceMode] =
    useState<InspectionServiceMode>("workshop");

  const prefilledCarId = (defaultDasmCarId ?? "").trim();
  const prefilledLabel = (defaultVehicleLabel ?? "").trim();
  const prefilledTitle =
    (defaultTitle ?? "").trim() ||
    (prefilledLabel ? `طلب فحص — ${prefilledLabel}` : "");
  const fromCoreCar = /^\d+$/.test(prefilledCarId) && Number(prefilledCarId) > 0;

  const verifiedWorkshops = useMemo(
    () => workshops.filter((w) => w.isVerified),
    [workshops]
  );

  const selectedWorkshop = useMemo(
    () => verifiedWorkshops.find((w) => w.id === preferredWorkshopId) ?? null,
    [verifiedWorkshops, preferredWorkshopId]
  );

  const displayPricing: WorkshopServicePricing | null = useMemo(() => {
    if (selectedWorkshop?.pricing) return selectedWorkshop.pricing;
    return platformPricing ?? null;
  }, [selectedWorkshop, platformPricing]);

  const selectedAmount =
    serviceMode === "field"
      ? displayPricing?.fieldSar
      : displayPricing?.workshopSar;

  return (
    <form
      ref={formRef}
      className="space-y-3 text-sm"
      dir="rtl"
      onSubmit={(e) => {
        e.preventDefault();
        setFeedback(null);
        const form = formRef.current;
        if (!form) return;
        const fd = new FormData(form);
        startTransition(async () => {
          const r = await createInspectionRequestAction(fd);
          if (r.ok) {
            form.reset();
            setPreferredWorkshopId("");
            setServiceMode("workshop");
            if (r.requestId) {
              router.push(`/track/${r.requestId}`);
              return;
            }
            router.refresh();
          } else {
            setFeedback(r.message);
          }
        });
      }}
    >
      <div className="space-y-1">
        <p className="text-base font-bold text-slate-950">بيانات طلب الفحص</p>
        <p className="text-xs leading-5 text-slate-600">
          اكتب وصف السيارة واختر طريقة الفحص؛ سننشئ عنوان الطلب تلقائياً.
        </p>
      </div>

      {fromCoreCar ? (
        <div
          className="rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2.5 text-xs text-sky-950 space-y-1"
          role="status"
        >
          <p className="font-semibold">بيانات السيارة من لوحة داسم</p>
          <p>
            رُبط الطلب بسيارة المنصّة رقم{" "}
            <span className="font-mono font-semibold">{prefilledCarId}</span>
            {prefilledLabel ? (
              <>
                {" "}
                — <span className="font-medium">{prefilledLabel}</span>
              </>
            ) : null}
            . يمكنك تعديل الوصف قبل الإرسال؛ المعرّف يبقى للربط مع الجوال والسجل.
          </p>
        </div>
      ) : null}

      <input type="hidden" name="title" value={prefilledTitle} />
      {defaultDasmUserId ? (
        <>
          <input
            type="hidden"
            name="dasm_car_id"
            value={fromCoreCar ? prefilledCarId : ""}
          />
          <input type="hidden" name="dasm_user_id" value={defaultDasmUserId} />
        </>
      ) : (
        <input
          name="dasm_car_id"
          placeholder="معرّف السيارة في داسم"
          aria-label="معرّف السيارة في داسم"
          required
          inputMode="numeric"
          className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
        />
      )}

      <div className="space-y-1.5">
        <label
          className="block text-xs font-medium text-gray-700"
          htmlFor="vehicle_label"
        >
          السيارة المراد فحصها
        </label>
        <input
          id="vehicle_label"
          name="vehicle_label"
          required
          defaultValue={prefilledLabel}
          autoComplete="off"
          placeholder="مثال: تويوتا كامري 2022 — أبيض"
          className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
        />
      </div>

      {defaultDasmUserId ? (
        <p className="rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">
          سيُحفظ الطلب تلقائياً في حسابك لدى داسم.
        </p>
      ) : (
        <input
          name="dasm_user_id"
          placeholder="رقم حساب داسم (اختياري)"
          aria-label="رقم حساب داسم"
          inputMode="numeric"
          className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
        />
      )}

      <div
        className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950 space-y-1.5"
        role="note"
      >
        <p className="font-semibold">قبل إرسال الطلب — يُرجى العلم:</p>
        <ul className="list-disc pr-4 space-y-1 text-amber-900/90">
          <li>
            الأسعار المعروضة مرجعية من كتالوج الورشة/المنصّة؛ الرسوم النهائية
            تُثبَّت عند إسناد الورشة للطلب.
          </li>
          <li>
            اختيار الورشة أدناه تفضيل للعميل ويساعد الإسناد؛ لا يضمن القبول
            الفوري.
          </li>
          <li>
            دفع رسوم خدمة الفحص عبر موب (Paymob) يتاح من صفحة التتبع بعد الإسناد
            والتسعير.
          </li>
        </ul>
      </div>

      {verifiedWorkshops.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            الورشة المفضّلة (من يمكنه قبول الطلب)
          </label>
          <select
            name="preferred_workshop_id"
            value={preferredWorkshopId}
            onChange={(e) => setPreferredWorkshopId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-white"
          >
            <option value="">— اختر ورشة معتمدة (اختياري) —</option>
            {verifiedWorkshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.city ? ` — ${w.city}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-gray-700">نوع الخدمة</legend>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="preferred_service_mode"
              value="workshop"
              checked={serviceMode === "workshop"}
              onChange={() => setServiceMode("workshop")}
            />
            <span>فحص في الورشة</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="preferred_service_mode"
              value="field"
              checked={serviceMode === "field"}
              onChange={() => setServiceMode("field")}
            />
            <span>فحص ميداني</span>
          </label>
        </div>
      </fieldset>

      {serviceMode === "field" ? (
        <div className="space-y-1.5">
          <label
            className="block text-xs font-medium text-gray-700"
            htmlFor="field_service_address"
          >
            موقع الفحص الميداني
          </label>
          <input
            id="field_service_address"
            name="field_service_address"
            required
            autoComplete="street-address"
            placeholder="المدينة، الحي، الشارع أو رابط الموقع"
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base"
          />
          <p className="text-[11px] text-gray-500">
            تستخدمه الورشة لتأكيد إمكانية الوصول والموعد.
          </p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-700" htmlFor="preferred_slot_at">
          الموعد المفضّل (اختياري)
        </label>
        <input
          id="preferred_slot_at"
          name="preferred_slot_at"
          type="datetime-local"
          className="w-full border rounded-lg px-3 py-2 bg-white"
        />
        <p className="text-[11px] text-gray-500">
          تفضيل زمني للعميل — ليس حجزاً نهائياً. للفحص الميداني قد يُنسخ إلى تقويم الورشة عند الإسناد.
        </p>
      </div>

      {displayPricing &&
        (displayPricing.workshopSar != null ||
          displayPricing.fieldSar != null) && (
          <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2 space-y-2">
            <p className="text-xs font-medium text-violet-900">
              {selectedWorkshop
                ? `أسعار مرجعية — ${selectedWorkshop.name}`
                : "أسعار مرجعية للمنصّة (قبل اختيار الورشة)"}
            </p>
            <WorkshopPricingBadges pricing={displayPricing} compact />
            {selectedAmount != null && (
              <p className="text-xs text-violet-950">
                المبلغ المرجعي لنوع الخدمة المختار:{" "}
                <span className="font-semibold">
                  {formatInspectionPriceSar(
                    selectedAmount,
                    displayPricing.currency
                  )}
                </span>
              </p>
            )}
          </div>
        )}

      <input
        name="auction_reference"
        placeholder="مرجع مزاد (اختياري)"
        className="w-full border rounded-lg px-3 py-2"
      />
      {feedback ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-800"
        >
          {feedback}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-xl px-4 py-3 text-base font-bold text-white shadow-sm disabled:opacity-60"
        style={{ backgroundColor: colors.primary }}
      >
        {pending ? "جاري الإرسال…" : "إرسال طلب الفحص"}
      </button>
    </form>
  );
}
