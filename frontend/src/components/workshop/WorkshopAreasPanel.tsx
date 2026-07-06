"use client";

import { useState } from "react";
import {
  addWorkshopServiceAreaAction,
  removeAreaFormAction,
} from "@/app/actions/workshop-management";
import type { WorkshopServiceArea } from "@/types/workshop-management";

export function WorkshopAreasPanel({
  workshopId,
  workshopSlug,
  areas,
}: {
  workshopId: string;
  workshopSlug: string;
  areas: WorkshopServiceArea[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">إضافة منطقة</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={async (fd) => {
            setPending(true);
            setMessage(null);
            const r = await addWorkshopServiceAreaAction(fd);
            setMessage(r.ok ? "تمت إضافة المنطقة." : r.message);
            setPending(false);
          }}
        >
          <input type="hidden" name="workshop_id" value={workshopId} />
          <input type="hidden" name="workshop_slug" value={workshopSlug} />
          <label className="block">
            <span className="text-xs font-medium text-gray-600">المدينة</span>
            <input
              name="city"
              required
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="مثال: الرياض"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">حي / ملاحظة</span>
            <input
              name="district"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="اختياري"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="supports_workshop" defaultChecked />
            فحص في الورشة
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="supports_field" defaultChecked />
            فحص ميداني
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_primary" />
            المدينة الرئيسية للورشة
          </label>
          <button
            type="submit"
            disabled={pending}
            className="sm:col-span-2 rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1857b8] disabled:opacity-60"
          >
            {pending ? "جارٍ الحفظ…" : "إضافة منطقة"}
          </button>
        </form>
        {message && (
          <p className="mt-2 text-sm text-gray-600" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          مناطق الخدمة ({areas.length})
        </h2>
        {areas.length === 0 ? (
          <p className="text-sm text-gray-500">
            أضف مدنًا تغطيها الورشة للفحص في الموقع أو ميدانيًا.
          </p>
        ) : (
          <ul className="space-y-3">
            {areas.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {a.city}
                    {a.isPrimary && (
                      <span className="mr-2 rounded bg-violet-100 px-2 py-0.5 text-xs text-[#1857b8]">
                        رئيسية
                      </span>
                    )}
                  </p>
                  {a.district && (
                    <p className="text-xs text-gray-500">{a.district}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    {a.supportsWorkshop && "ورشة "}
                    {a.supportsWorkshop && a.supportsField && "· "}
                    {a.supportsField && "ميداني"}
                  </p>
                </div>
                <form action={removeAreaFormAction}>
                  <input type="hidden" name="workshop_id" value={workshopId} />
                  <input type="hidden" name="area_id" value={a.id} />
                  <input type="hidden" name="workshop_slug" value={workshopSlug} />
                  <button
                    type="submit"
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    حذف
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
