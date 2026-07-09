"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Workshop, Inspector } from "@/types";
import { assignInspectionRequestAction } from "@/app/actions/inspection-workflow";
import { useTheme } from "@/hooks";

interface InspectorAssignmentPanelProps {
  requestId: string;
  currentWorkshopId?: string;
  currentInspectorId?: string;
  preferredWorkshopId?: string;
  preferredSlotAt?: string;
  workshops: Workshop[];
  inspectors: Inspector[];
}

export function InspectorAssignmentPanel({
  requestId,
  currentWorkshopId,
  currentInspectorId,
  preferredWorkshopId,
  preferredSlotAt,
  workshops,
  inspectors,
}: InspectorAssignmentPanelProps) {
  const { colors } = useTheme({ role: "workshop" });
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [workshopId, setWorkshopId] = useState(
    currentWorkshopId || preferredWorkshopId || ""
  );
  const [inspectorId, setInspectorId] = useState(currentInspectorId ?? "");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const preferredWorkshopName = useMemo(() => {
    if (!preferredWorkshopId) return null;
    return workshops.find((w) => w.id === preferredWorkshopId)?.name ?? preferredWorkshopId;
  }, [preferredWorkshopId, workshops]);

  const filteredInspectors = useMemo(() => {
    if (!workshopId) return inspectors;
    return inspectors.filter((i) => i.workshopId === workshopId);
  }, [inspectors, workshopId]);

  function handleSubmit() {
    setFeedback(null);
    startTransition(async () => {
      const result = await assignInspectionRequestAction(
        requestId,
        workshopId,
        inspectorId
      );
      if (result.ok) {
        setFeedback({ type: "success", message: "تم الإسناد بنجاح." });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.message });
      }
    });
  }

  return (
    <div className="space-y-3 text-sm" dir="rtl">
      {(preferredWorkshopName || preferredSlotAt) && (
        <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs text-sky-950 space-y-1">
          <p className="font-semibold">تفضيل العميل عند الإنشاء</p>
          {preferredWorkshopName ? (
            <p>الورشة المفضّلة: {preferredWorkshopName}</p>
          ) : null}
          {preferredSlotAt ? (
            <p>
              الموعد المفضّل:{" "}
              {new Date(preferredSlotAt).toLocaleString("ar-SA", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </div>
      )}
      <div>
        <label className="block text-gray-500 mb-1">الورشة</label>
        <select
          className="w-full border rounded-lg px-3 py-2 bg-gray-50"
          style={{ borderColor: colors.secondary }}
          value={workshopId}
          disabled={pending}
          onChange={(e) => {
            setWorkshopId(e.target.value);
            setInspectorId("");
            setFeedback(null);
          }}
        >
          <option value="">-- اختر ورشة --</option>
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
          value={inspectorId}
          disabled={pending || !workshopId}
          onChange={(e) => {
            setInspectorId(e.target.value);
            setFeedback(null);
          }}
        >
          <option value="">-- اختر مفتشا --</option>
          {filteredInspectors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.fullName}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={pending || !workshopId || !inspectorId}
        className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
        style={{ backgroundColor: colors.primary }}
        onClick={handleSubmit}
      >
        {pending ? "جارٍ الإسناد..." : "تأكيد الإسناد"}
      </button>

      {feedback && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
