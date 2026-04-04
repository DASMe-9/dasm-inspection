"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignInspectionRequestAction,
  approveReportAction,
  rejectReportAction,
  startInspectionAction,
  submitReportForReviewAction,
} from "@/app/actions/inspection-workflow";
import type { InspectionRequest, Inspector, Workshop } from "@/types";
import { useTheme } from "@/hooks";

export function RequestWorkflowPanel({
  request,
  workshops,
  inspectors,
}: {
  request: InspectionRequest;
  workshops: Workshop[];
  inspectors: Inspector[];
}) {
  const { colors } = useTheme({ role: "workshop" });
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [workshopId, setWorkshopId] = useState(request.workshopId ?? "");
  const [inspectorId, setInspectorId] = useState(request.inspectorId ?? "");

  const inspectorsFiltered = useMemo(() => {
    if (!workshopId) return inspectors;
    return inspectors.filter((i) => i.workshopId === workshopId);
  }, [inspectors, workshopId]);

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && "message" in r && r.message) setMsg(r.message);
      else if (r.ok) {
        setMsg("تم التنفيذ.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4" dir="rtl">
      {request.status === "submitted" && (
        <div
          className="rounded-lg border p-4 space-y-3 bg-white"
          style={{ borderColor: colors.secondary }}
        >
          <p className="font-medium text-sm">إسناد الطلب</p>
          <div className="space-y-2 text-sm">
            <label className="block">
              <span className="text-gray-500">الورشة</span>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={workshopId}
                onChange={(e) => {
                  setWorkshopId(e.target.value);
                  setInspectorId("");
                }}
              >
                <option value="">— اختر —</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-gray-500">المفتش</span>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={inspectorId}
                onChange={(e) => setInspectorId(e.target.value)}
                disabled={!workshopId}
              >
                <option value="">— اختر —</option>
                {inspectorsFiltered.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={pending || !workshopId || !inspectorId}
            className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
            onClick={() =>
              run(() =>
                assignInspectionRequestAction(
                  request.id,
                  workshopId,
                  inspectorId
                )
              )
            }
          >
            تأكيد الإسناد
          </button>
        </div>
      )}

      {request.status === "assigned" && (
        <button
          type="button"
          disabled={pending}
          className="w-full py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: colors.primary }}
          onClick={() => run(() => startInspectionAction(request.id))}
        >
          بدء الفحص (قيد التنفيذ)
        </button>
      )}

      {request.status === "in_progress" && (
        <button
          type="button"
          disabled={pending}
          className="w-full py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: colors.primary }}
          onClick={() => run(() => submitReportForReviewAction(request.id))}
        >
          تقديم التقرير للمراجعة
        </button>
      )}

      {request.status === "pending_review" && request.reportId && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              className="flex-1 py-2 rounded-lg text-white text-sm"
              style={{ backgroundColor: "#16a34a" }}
              onClick={() => run(() => approveReportAction(request.id))}
            >
              اعتماد التقرير
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="سبب الرفض (اختياري للرفض)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <button
              type="button"
              disabled={pending || !rejectReason.trim()}
              className="py-2 px-3 rounded-lg text-white text-sm shrink-0"
              style={{ backgroundColor: "#dc2626" }}
              onClick={() =>
                run(() => rejectReportAction(request.id, rejectReason))
              }
            >
              رفض
            </button>
          </div>
        </div>
      )}

      {request.status === "approved" && (
        <p className="text-sm text-gray-600 rounded-lg border border-dashed p-3 bg-gray-50">
          تم اعتماد التقرير؛ تنتهي دورة الفحص هنا. متابعة الشحن أو التسليم تتم في
          النظام المخصص لذلك وليس في هذا التطبيق.
        </p>
      )}

      {msg && (
        <p className="text-xs text-gray-600" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
