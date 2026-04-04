"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInspectionRequestAction } from "@/app/actions/inspection-workflow";
import { useTheme } from "@/hooks";

export function NewInspectionRequestForm() {
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
      <input
        name="title"
        required
        placeholder="عنوان الطلب"
        className="w-full border rounded-lg px-3 py-2"
      />
      <input
        name="dasm_car_id"
        required
        placeholder="dasm_car_id"
        className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
      />
      <input
        name="vehicle_label"
        required
        placeholder="وصف المركبة (للعرض)"
        className="w-full border rounded-lg px-3 py-2"
      />
      <input
        name="dasm_user_id"
        placeholder="dasm_user_id (اختياري)"
        className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
      />
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
