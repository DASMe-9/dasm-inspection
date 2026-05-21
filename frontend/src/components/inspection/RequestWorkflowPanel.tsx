"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignInspectionRequestAction,
  approveReportAction,
  cancelInspectionRequestAction,
  confirmOnSiteAction,
  dispatchInspectionAction,
  rejectReportAction,
  startInspectionAction,
  submitReportForReviewAction,
} from "@/app/actions/inspection-workflow";
import {
  canConfirmOnSite,
  canDispatchInspector,
  canStartInspection,
} from "@/lib/inspection-request-transitions";
import { formatInspectionPriceSar, pricingLabelAr } from "@/lib/inspection-pricing";
import type { InspectionRequest, InspectionServiceMode, Inspector, Workshop } from "@/types";
import { useTheme } from "@/hooks";
import { RepairQuotePanel } from "./RepairQuotePanel";

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
  const [cancelReason, setCancelReason] = useState("");
  const [workshopId, setWorkshopId] = useState(request.workshopId ?? "");
  const [inspectorId, setInspectorId] = useState(request.inspectorId ?? "");
  const [serviceMode, setServiceMode] = useState<InspectionServiceMode>(
    request.serviceMode ?? "workshop"
  );
  const [fieldAddress, setFieldAddress] = useState(
    request.fieldServiceAddress ?? ""
  );

  const ctx = useMemo(
    () => ({
      status: request.status,
      serviceMode: request.serviceMode ?? "workshop",
    }),
    [request.status, request.serviceMode]
  );

  const selectedWorkshop = workshops.find((w) => w.id === workshopId);
  const previewFee =
    serviceMode === "field"
      ? selectedWorkshop?.pricing?.fieldSar
      : selectedWorkshop?.pricing?.workshopSar;

  const canCancel =
    ["submitted", "assigned", "dispatched", "on_site", "in_progress"].includes(
      request.status
    ) && !request.reportId;

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
            <fieldset className="space-y-2">
              <legend className="text-gray-500 text-xs">نوع الخدمة</legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="service_mode"
                  checked={serviceMode === "workshop"}
                  onChange={() => setServiceMode("workshop")}
                />
                {pricingLabelAr("workshop")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="service_mode"
                  checked={serviceMode === "field"}
                  onChange={() => setServiceMode("field")}
                />
                {pricingLabelAr("field")}
              </label>
            </fieldset>
            {serviceMode === "field" && (
              <label className="block">
                <span className="text-gray-500">عنوان الفحص الميداني</span>
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={fieldAddress}
                  onChange={(e) => setFieldAddress(e.target.value)}
                  placeholder="الحي، الشارع، المدينة"
                  required
                />
              </label>
            )}
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
            {previewFee != null && (
              <p className="text-xs text-violet-800 rounded-lg bg-violet-50 px-2 py-1.5">
                تقدير الرسوم: {formatInspectionPriceSar(previewFee)}
              </p>
            )}
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
            disabled={
              pending ||
              !workshopId ||
              !inspectorId ||
              (serviceMode === "field" && !fieldAddress.trim())
            }
            className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
            onClick={() =>
              run(() =>
                assignInspectionRequestAction(
                  request.id,
                  workshopId,
                  inspectorId,
                  {
                    serviceMode,
                    fieldServiceAddress:
                      serviceMode === "field" ? fieldAddress.trim() : undefined,
                  }
                )
              )
            }
          >
            تأكيد الإسناد
          </button>
        </div>
      )}

      {request.status !== "submitted" && request.serviceMode === "field" && (
        <div className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2 text-xs text-violet-900 space-y-1">
          <p>
            <span className="font-medium">الخدمة:</span> فحص ميداني
          </p>
          {request.fieldServiceAddress && (
            <p>
              <span className="font-medium">الموقع:</span>{" "}
              {request.fieldServiceAddress}
            </p>
          )}
          {request.quotedFeeSar != null && (
            <p>
              <span className="font-medium">الرسوم المرجعية:</span>{" "}
              {formatInspectionPriceSar(request.quotedFeeSar)}
            </p>
          )}
        </div>
      )}

      {canDispatchInspector(ctx) && (
        <button
          type="button"
          disabled={pending}
          className="w-full py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: colors.primary }}
          onClick={() => run(() => dispatchInspectionAction(request.id))}
        >
          توجيه المفتش إلى الموقع
        </button>
      )}

      {canConfirmOnSite(ctx) && (
        <button
          type="button"
          disabled={pending}
          className="w-full py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: colors.accent }}
          onClick={() => run(() => confirmOnSiteAction(request.id))}
        >
          تأكيد الوصول للموقع
        </button>
      )}

      {canStartInspection(ctx) && (
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

      <RepairQuotePanel request={request} />

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

      {request.status === "cancelled" && (
        <p className="text-sm text-amber-800 rounded-lg border border-amber-200 p-3 bg-amber-50">
          تم إلغاء هذا الطلب؛ لن يُستأنف الفحص ضمن نفس السجل.
        </p>
      )}

      {request.status === "rejected" && (
        <p className="text-sm text-gray-600 rounded-lg border border-dashed p-3 bg-gray-50">
          وُسِم التقرير بالرفض؛ راجع الملاحظات في سجل الحالة أو افتح التقرير.
        </p>
      )}

      {canCancel && (
        <div
          className="rounded-lg border border-red-100 bg-red-50/80 p-4 space-y-2"
          style={{ borderColor: "#fecaca" }}
        >
          <p className="font-medium text-sm text-red-900">إلغاء الطلب</p>
          <p className="text-xs text-red-800/90">
            يُسمَح الإلغاء قبل اعتماد التقرير وفقط إن لم يُنشأ تقرير مرتبط بعد.
          </p>
          <textarea
            className="w-full rounded-lg border border-red-100 bg-white px-3 py-2 text-sm min-h-[72px]"
            placeholder="سبب الإلغاء (اختياري)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            className="w-full min-h-[48px] py-2.5 rounded-lg text-white text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50"
            onClick={() => {
              if (
                !window.confirm(
                  "تأكيد إلغاء طلب الفحص؟ لا يمكن التراجع عن ذلك من هذه الشاشة."
                )
              ) {
                return;
              }
              run(() =>
                cancelInspectionRequestAction(
                  request.id,
                  cancelReason.trim() || undefined
                )
              );
            }}
          >
            إلغاء الطلب
          </button>
        </div>
      )}

      {msg && (
        <p className="text-xs text-gray-600" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
