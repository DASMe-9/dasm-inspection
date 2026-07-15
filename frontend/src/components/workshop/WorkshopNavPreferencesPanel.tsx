"use client";

import { useState, useTransition } from "react";
import { saveWorkshopNavPreferencesAction } from "@/app/actions/workshop-nav-preferences";
import {
  WORKSHOP_CUSTOMIZABLE_NAV_KEYS,
  WORKSHOP_NAV_LABELS,
} from "@/lib/auth/workshop-nav-preferences";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";

export function WorkshopNavPreferencesPanel({
  workshopId,
  hiddenNavKeys,
  workshopName,
}: {
  workshopId: string;
  hiddenNavKeys: InspectionNavKey[];
  /** اسم الورشة لسياق لوحة المسؤول */
  workshopName?: string;
}) {
  const [hidden, setHidden] = useState<Set<InspectionNavKey>>(
    () => new Set(hiddenNavKeys)
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(key: InspectionNavKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function onSave() {
    setMsg(null);
    const fd = new FormData();
    fd.set("workshop_id", workshopId);
    for (const key of Array.from(hidden)) {
      fd.append("hidden_nav_keys", key);
    }
    startTransition(async () => {
      const r = await saveWorkshopNavPreferencesAction(fd);
      setMsg(r.ok ? "تم حفظ تفضيلات الشريط." : r.message);
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          تخصيص الشريط الجانبي
          {workshopName ? (
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {" "}
              — {workshopName}
            </span>
          ) : null}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          تحكم إشرافي: اختر الأدوات المخفية عن صاحب هذه الورشة في الشريط الجانبي
          وشريط الجوال. لوحة الورشة تبقى دائماً ظاهرة.
        </p>
      </div>
      <ul className="space-y-2">
        {WORKSHOP_CUSTOMIZABLE_NAV_KEYS.map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-[#1E74E8]/40 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-sky-500/40">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#1E74E8] focus:ring-[#1E74E8] dark:border-slate-500"
                checked={hidden.has(key)}
                onChange={() => toggle(key)}
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                إخفاء: {WORKSHOP_NAV_LABELS[key]}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="rounded-xl bg-[#1E74E8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1862c4] disabled:opacity-50"
      >
        {pending ? "جاري الحفظ…" : "حفظ تفضيلات الشريط"}
      </button>
      {msg ? (
        <p
          className={`text-xs ${msg.includes("تعذّر") || msg.includes("غير") || msg.includes("متاح") ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
