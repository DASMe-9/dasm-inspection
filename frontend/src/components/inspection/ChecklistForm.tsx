"use client";

/**
 * Placeholder checklist UI — items sync with report items after backend wiring.
 */
const TEMPLATE = [
  { id: "t1", label: "المحرك والتسريبات" },
  { id: "t2", label: "الفرامل والتعليق" },
  { id: "t3", label: "الهيكل والصدأ" },
  { id: "t4", label: "الإضاءة والإشارات" },
  { id: "t5", label: "السلامة الداخلية" },
];

export function ChecklistForm() {
  return (
    <div className="space-y-3" dir="rtl">
      {TEMPLATE.map((row) => (
        <label
          key={row.id}
          className="flex items-center gap-3 text-sm text-gray-700"
        >
          <input type="checkbox" disabled className="rounded" />
          <span>{row.label}</span>
        </label>
      ))}
      <p className="text-xs text-gray-500 pt-1">
        التعبئة الفعلية تتم عبر التقرير والـ API؛ هذا عرض هيكلي فقط.
      </p>
    </div>
  );
}
