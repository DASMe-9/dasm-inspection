"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInspectionRequestAction } from "@/app/actions/inspection-workflow";
import { WorkshopPricingBadges } from "@/components/inspection/WorkshopPricingBadges";
import { useTheme } from "@/hooks";
import type { WorkshopServicePricing } from "@/types";

export function NewInspectionRequestForm({
  defaultDasmUserId,
  platformPricing,
}: {
  defaultDasmUserId?: string;
  platformPricing?: WorkshopServicePricing | null;
}) {
  const { colors } = useTheme({ role: "workshop" });
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="space-y-3 text-sm"
      dir="rtl"
      onSubmit={(e) => {
        e.preventDefault();
        const form = formRef.current;
        if (!form) return;
        const fd = new FormData(form);
        startTransition(async () => {
          const r = await createInspectionRequestAction(fd);
          if (r.ok) {
            form.reset();
            router.refresh();
          } else {
            alert(r.message);
          }
        });
      }}
    >
      <p className="font-medium">طلب فحص جديد</p>
      {platformPricing &&
        (platformPricing.workshopSar != null || platformPricing.fieldSar != null) && (
          <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
            <p className="mb-2 text-xs font-medium text-violet-900">
              أسعار مرجعية (قبل اختيار الورشة)
            </p>
            <WorkshopPricingBadges pricing={platformPricing} compact />
          </div>
        )}
      <input
        name="title"
        required
        placeholder="عنوان الطلب"
        className="w-full border rounded-lg px-3 py-2"
      />
      <input
        name="dasm_car_id"
        placeholder={
          defaultDasmUserId
            ? "dasm_car_id (اختياري — يُنشأ تلقائياً على المنصّة)"
            : "dasm_car_id (مطلوب بدون حساب داسم)"
        }
        required={!defaultDasmUserId}
        className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
      />
      <input
        name="vehicle_label"
        required
        placeholder="وصف المركبة (للعرض)"
        className="w-full border rounded-lg px-3 py-2"
      />
      {defaultDasmUserId ? (
        <>
          <input type="hidden" name="dasm_user_id" value={defaultDasmUserId} />
          <p className="rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-900">
            تم ربط الطلب بحسابك من منصّة داسم.
          </p>
        </>
      ) : (
        <input
          name="dasm_user_id"
          placeholder="dasm_user_id (اختياري)"
          className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
        />
      )}
      <input
        name="auction_reference"
        placeholder="مرجع مزاد (اختياري)"
        className="w-full border rounded-lg px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2 rounded-lg text-white font-medium"
        style={{ backgroundColor: colors.primary }}
      >
        إنشاء طلب (مرحلة: مُقدَّم)
      </button>
    </form>
  );
}
