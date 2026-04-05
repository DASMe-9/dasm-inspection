"use client";

import { useState, useTransition } from "react";
import type { InspectionReportItem, ReportItemStatus } from "@/types";
import { updateReportItemAction } from "@/app/actions/inspection-workflow";
import { useTheme } from "@/hooks";
import { TOKENS } from "@/lib/theme";

const STATUS_OPTIONS: { value: ReportItemStatus; label: string }[] = [
  { value: "pass", label: "مطابق" },
  { value: "warn", label: "ملاحظة" },
  { value: "fail", label: "غير مطابق" },
  { value: "na", label: "لا ينطبق" },
];

function statusColor(s: ReportItemStatus): string {
  switch (s) {
    case "pass":
      return TOKENS.colors.semantic.success;
    case "warn":
      return TOKENS.colors.semantic.warning;
    case "fail":
      return TOKENS.colors.semantic.error;
    case "na":
      return "#9CA3AF";
  }
}

interface ChecklistFormProps {
  reportId: string;
  items: InspectionReportItem[];
  editable: boolean;
}

export function ChecklistForm({ reportId: _reportId, items, editable }: ChecklistFormProps) {
  void _reportId; // reserved for future batch save
  const { colors } = useTheme({ role: "workshop" });

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500" dir="rtl">
        لا توجد بنود فحص بعد.
      </p>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {items.map((item) => (
        <ChecklistRow
          key={item.id}
          item={item}
          editable={editable}
          accentColor={colors.primary}
        />
      ))}
    </div>
  );
}

function ChecklistRow({
  item,
  editable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accentColor: _accentColor,
}: {
  item: InspectionReportItem;
  editable: boolean;
  accentColor: string;
}) {
  const [status, setStatus] = useState<ReportItemStatus>(item.status);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleChange(newStatus: ReportItemStatus, newNotes: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateReportItemAction(
        item.id,
        newStatus,
        newNotes || undefined
      );
      if (result.ok) {
        setFeedback("تم الحفظ");
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback(result.message);
      }
    });
  }

  const borderColor = statusColor(status);

  return (
    <div
      className="rounded-lg border p-3 bg-white space-y-2"
      style={{ borderColor }}
    >
      <div className="flex justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">{item.section}</p>
          <p className="font-medium text-sm">{item.label}</p>
        </div>
        {editable ? (
          <select
            className="text-xs border rounded px-2 py-1 bg-gray-50 shrink-0 h-fit"
            value={status}
            disabled={pending}
            onChange={(e) => {
              const val = e.target.value as ReportItemStatus;
              setStatus(val);
              handleChange(val, notes);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className="text-xs font-medium px-2 py-1 rounded text-white shrink-0 h-fit"
            style={{ backgroundColor: borderColor }}
          >
            {STATUS_OPTIONS.find((o) => o.value === status)?.label}
          </span>
        )}
      </div>

      {editable ? (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 text-sm border rounded-lg px-3 py-1.5 bg-gray-50"
            placeholder="ملاحظات..."
            value={notes}
            disabled={pending}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (item.notes ?? "")) {
                handleChange(status, notes);
              }
            }}
          />
          {pending && (
            <span className="text-xs text-gray-400 shrink-0">جارٍ الحفظ...</span>
          )}
          {feedback && !pending && (
            <span className="text-xs text-gray-500 shrink-0">{feedback}</span>
          )}
        </div>
      ) : (
        item.notes && (
          <p className="text-sm text-gray-600">{item.notes}</p>
        )
      )}
    </div>
  );
}
