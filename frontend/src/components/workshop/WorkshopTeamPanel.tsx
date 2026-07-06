"use client";

import { useState } from "react";
import {
  addWorkshopInspectorAction,
  setInspectorActiveFormAction,
} from "@/app/actions/workshop-management";
import type { Inspector } from "@/types";

export function WorkshopTeamPanel({
  workshopId,
  workshopSlug,
  inspectors,
}: {
  workshopId: string;
  workshopSlug: string;
  inspectors: Inspector[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-6">
      <Section title="إضافة مفتش">
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={async (fd) => {
            setPending(true);
            setMessage(null);
            const r = await addWorkshopInspectorAction(fd);
            setMessage(r.ok ? "تمت الإضافة." : r.message);
            setPending(false);
          }}
        >
          <input type="hidden" name="workshop_id" value={workshopId} />
          <input type="hidden" name="workshop_slug" value={workshopSlug} />
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-gray-600">الاسم الكامل</span>
            <input
              name="full_name"
              required
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="مثال: أحمد العتيبي"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              معرف مستخدم داسم (اختياري)
            </span>
            <input
              name="dasm_user_id"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="UUID من المنصّة"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="sm:col-span-2 rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1857b8] disabled:opacity-60"
          >
            {pending ? "جارٍ الحفظ…" : "إضافة للفريق"}
          </button>
        </form>
        {message && (
          <p className="mt-2 text-sm text-gray-600" role="status">
            {message}
          </p>
        )}
      </Section>

      <Section title={`أعضاء الفريق (${inspectors.length})`}>
        {inspectors.length === 0 ? (
          <p className="text-sm text-gray-500">لا مفتشين مسجّلين بعد.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {inspectors.map((ins) => (
              <li
                key={ins.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{ins.fullName}</p>
                  {ins.dasm_user_id && (
                    <p className="text-xs text-gray-500">{ins.dasm_user_id}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      ins.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ins.active ? "نشط" : "موقوف"}
                  </span>
                  <form action={setInspectorActiveFormAction}>
                    <input type="hidden" name="workshop_id" value={workshopId} />
                    <input type="hidden" name="inspector_id" value={ins.id} />
                    <input type="hidden" name="workshop_slug" value={workshopSlug} />
                    <input
                      type="hidden"
                      name="active"
                      value={ins.active ? "0" : "1"}
                    />
                    <button
                      type="submit"
                      className="text-xs font-semibold text-[#1E74E8] hover:underline"
                    >
                      {ins.active ? "إيقاف" : "تفعيل"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
