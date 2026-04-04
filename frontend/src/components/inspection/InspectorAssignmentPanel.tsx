"use client";

import type { Workshop, Inspector } from "@/types";
import { useTheme } from "@/hooks";

export function InspectorAssignmentPanel({
  workshops,
  inspectors,
  selectedWorkshopId,
  selectedInspectorId,
}: {
  workshops: Workshop[];
  inspectors: Inspector[];
  selectedWorkshopId?: string;
  selectedInspectorId?: string;
}) {
  const { colors } = useTheme({ role: "workshop" });
  const filtered = selectedWorkshopId
    ? inspectors.filter((i) => i.workshopId === selectedWorkshopId)
    : inspectors;

  return (
    <div className="space-y-3 text-sm" dir="rtl">
      <div>
        <label className="block text-gray-500 mb-1">الورشة</label>
        <select
          className="w-full border rounded-lg px-3 py-2 bg-gray-50"
          style={{ borderColor: colors.secondary }}
          disabled
          value={selectedWorkshopId ?? ""}
        >
          <option value="">— اختر ورشة —</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-500 mb-1">المفتش</label>
        <select
          className="w-full border rounded-lg px-3 py-2 bg-gray-50"
          style={{ borderColor: colors.secondary }}
          disabled
          value={selectedInspectorId ?? ""}
        >
          <option value="">— اختر مفتشاً —</option>
          {filtered.map((i) => (
            <option key={i.id} value={i.id}>
              {i.fullName}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-500">
        التفعيل مع صلاحيات inspection_admin عند ربط الـ API.
      </p>
    </div>
  );
}
