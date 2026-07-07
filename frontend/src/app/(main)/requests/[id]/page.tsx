import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RequestStatusBadge,
  StatusTimeline,
  ChecklistForm,
  RequestWorkflowPanel,
  RequestAttachmentsSection,
} from "@/components/inspection";
import { RepairRecommendationsSection } from "@/components/inspection/RepairRecommendationsSection";
import { RequestMessagesSection } from "@/components/inspection/RequestMessagesSection";
import { SectionCard } from "@/components/shared";
import {
  getHistoryForRequest,
  getInspector,
  getReport,
  getReportByRequestId,
  getInspectionRequest,
  getWorkshop,
  listInspectors,
  listWorkshops,
} from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";

function AttachmentsSectionSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div
        className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-4 dark:bg-slate-700"
        aria-hidden
      />
      <div className="space-y-2 animate-pulse">
        <div className="h-12 rounded-xl bg-gray-100 dark:bg-slate-700" />
        <div className="h-12 rounded-xl bg-gray-100 w-11/12 max-w-full dark:bg-slate-700" />
      </div>
    </div>
  );
}

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const req = await getInspectionRequest(params.id);
  if (!req) notFound();

  const [workshops, inspectors] = await Promise.all([
    listWorkshops(),
    listInspectors(),
  ]);

  const workshop = req.workshopId ? await getWorkshop(req.workshopId) : undefined;
  const inspector = req.inspectorId
    ? await getInspector(req.inspectorId)
    : undefined;
  const report = req.reportId
    ? await getReport(req.reportId)
    : await getReportByRequestId(req.id);
  const history = await getHistoryForRequest(req.id);

  const canUploadAttachment = [
    "submitted",
    "assigned",
    "dispatched",
    "on_site",
    "in_progress",
    "pending_review",
  ].includes(req.status);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{req.title}</h2>
        <RequestStatusBadge status={req.status} />
      </div>

      <SectionCard title="سير العمل">
        <RequestWorkflowPanel
          request={req}
          workshops={workshops}
          inspectors={inspectors}
        />
      </SectionCard>

      <SectionCard title="هوية DASM والمركبة">
        <dl className="text-sm space-y-2">
          <div>
            <dt className="text-gray-600 dark:text-slate-400">dasm_car_id</dt>
            <dd className="font-mono text-gray-900 break-all dark:text-slate-100">{req.dasm_car_id}</dd>
          </div>
          {req.dasm_user_id && (
            <div>
              <dt className="text-gray-600 dark:text-slate-400">dasm_user_id</dt>
              <dd className="font-mono text-gray-900 break-all dark:text-slate-100">{req.dasm_user_id}</dd>
            </div>
          )}
          {req.auction_reference && (
            <div>
              <dt className="text-gray-600 dark:text-slate-400">مرجع مزاد</dt>
              <dd className="text-gray-900 dark:text-slate-100">{req.auction_reference}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-600 dark:text-slate-400">المركبة</dt>
            <dd className="text-gray-900 font-medium dark:text-slate-100">{req.vehicleLabel}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="الإسناد والخدمة">
        <p className="text-sm">
          <span className="text-gray-500 dark:text-slate-400">الورشة:</span>{" "}
          {workshop?.name ?? "—"}
        </p>
        <p className="text-sm mt-1">
          <span className="text-gray-500 dark:text-slate-400">المفتش:</span>{" "}
          {inspector?.fullName ?? "—"}
        </p>
        <p className="text-sm mt-1">
          <span className="text-gray-500 dark:text-slate-400">نوع الخدمة:</span>{" "}
          {req.serviceMode === "field" ? "ميداني" : "في الورشة"}
        </p>
        {req.fieldServiceAddress && (
          <p className="text-sm mt-1">
            <span className="text-gray-500 dark:text-slate-400">عنوان ميداني:</span>{" "}
            {req.fieldServiceAddress}
          </p>
        )}
        {req.quotedFeeSar != null && (
          <p className="text-sm mt-1">
            <span className="text-gray-500 dark:text-slate-400">رسوم خدمة الفحص:</span>{" "}
            {req.quotedFeeSar} ر.س
          </p>
        )}
        {req.repairQuoteSar != null && (
          <p className="text-sm mt-1">
            <span className="text-gray-500 dark:text-slate-400">عرض إصلاح (منفصل):</span>{" "}
            {req.repairQuoteSar} ر.س
            {req.repairQuoteNotes && (
              <span className="block text-gray-600 text-xs mt-0.5">
                {req.repairQuoteNotes}
              </span>
            )}
          </p>
        )}
      </SectionCard>

      {report &&
        (req.status === "in_progress" ||
          req.status === "on_site" ||
          req.status === "pending_review") && (
          <SectionCard title="قائمة الفحص">
            <ChecklistForm
              reportId={report.id}
              items={report.items}
              editable={req.status === "in_progress"}
            />
          </SectionCard>
        )}

      <RepairRecommendationsSection requestId={req.id} reportId={req.reportId} />

      <RequestMessagesSection requestId={req.id} ownerId={req.dasm_user_id ?? null} />

      <SectionCard title="خط زمني للحالة">
        <StatusTimeline items={history} />
      </SectionCard>

      <Suspense fallback={<AttachmentsSectionSkeleton />}>
        <RequestAttachmentsSection
          requestId={req.id}
          canUpload={canUploadAttachment}
        />
      </Suspense>

      {report && (
        <SectionCard title="التقرير">
          <p className="text-sm text-gray-600 mb-2 dark:text-slate-300">{report.overallSummary}</p>
          <Link
            href={`/reports/${report.id}`}
            className="inline-block text-sm font-medium"
            style={{ color: TOKENS.colors.roles.workshop.primary }}
          >
            فتح تقرير الفحص ←
          </Link>
        </SectionCard>
      )}
    </div>
  );
}
