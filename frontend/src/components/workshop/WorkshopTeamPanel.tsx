"use client";

import { useState } from "react";
import {
  addWorkshopInspectorAction,
  setInspectorActiveFormAction,
} from "@/app/actions/workshop-management";
import { workshopUi } from "@/lib/workshop-ui";
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
            <span className={workshopUi.label}>الاسم الكامل</span>
            <input
              name="full_name"
              required
              className={workshopUi.input}
              placeholder="مثال: أحمد العتيبي"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={workshopUi.label}>معرف مستخدم داسم (اختياري)</span>
            <input
              name="dasm_user_id"
              className={workshopUi.input}
              placeholder="UUID من المنصّة"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className={`sm:col-span-2 ${workshopUi.primaryBtn}`}
          >
            {pending ? "جارٍ الحفظ…" : "إضافة للفريق"}
          </button>
        </form>
        {message && (
          <p className={`mt-2 ${workshopUi.muted}`} role="status">
            {message}
          </p>
        )}
      </Section>

      <Section title={`أعضاء الفريق (${inspectors.length})`}>
        {inspectors.length === 0 ? (
          <p className={workshopUi.mutedXs}>لا مفتشين مسجّلين بعد.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {inspectors.map((ins) => (
              <li
                key={ins.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className={workshopUi.body}>{ins.fullName}</p>
                  {ins.dasm_user_id && (
                    <p className={workshopUi.mutedXs}>{ins.dasm_user_id}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      ins.active ? workshopUi.statusOk : workshopUi.statusOff
                    }
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
    <section className={workshopUi.card}>
      <h2 className={workshopUi.cardTitle}>{title}</h2>
      {children}
    </section>
  );
}
