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
}: {
  workshopId: string;
  hiddenNavKeys: InspectionNavKey[];
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
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          تخصيص الشريط الجانبي
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          اختر الأدوات التي تريد إخفاءها من الشريط الجانبي وشريط الجوال. لوحة
          الورشة تبقى دائماً ظاهرة.
        </p>
      </div>
      <ul className="space-y-2">
        {WORKSHOP_CUSTOMIZABLE_NAV_KEYS.map((key) => (
          <li key={key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition hover:border-[#1E74E8]/40 dark:border-slate-600 dark:bg-slate-900 dark:hover:border-sky-500/40">
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
        className="rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1862c4] disabled:opacity-50"
      >
        {pending ? "جاري الحفظ…" : "حفظ تفضيلات الشريط"}
      </button>
      {msg ? (
        <p
          className={`text-xs ${msg.includes("تعذّر") || msg.includes("غير") ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
