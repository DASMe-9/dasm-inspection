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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div
        className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-4"
        aria-hidden
      />
      <div className="space-y-2 animate-pulse">
        <div className="h-12 rounded-xl bg-gray-100" />
        <div className="h-12 rounded-xl bg-gray-100 w-11/12 max-w-full" />
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
    "in_progress",
    "pending_review",
  ].includes(req.status);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-lg font-bold text-gray-900">{req.title}</h2>
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
            <dt className="text-gray-600">dasm_car_id</dt>
            <dd className="font-mono text-gray-900 break-all">{req.dasm_car_id}</dd>
          </div>
          {req.dasm_user_id && (
            <div>
              <dt className="text-gray-600">dasm_user_id</dt>
              <dd className="font-mono text-gray-900 break-all">{req.dasm_user_id}</dd>
            </div>
          )}
          {req.auction_reference && (
            <div>
              <dt className="text-gray-600">مرجع مزاد</dt>
              <dd className="text-gray-900">{req.auction_reference}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-600">المركبة</dt>
            <dd className="text-gray-900 font-medium">{req.vehicleLabel}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="الإسناد الحالي">
        <p className="text-sm">
          <span className="text-gray-500">الورشة:</span>{" "}
          {workshop?.name ?? "—"}
        </p>
        <p className="text-sm mt-1">
          <span className="text-gray-500">المفتش:</span>{" "}
          {inspector?.fullName ?? "—"}
        </p>
      </SectionCard>

      {report &&
        (req.status === "in_progress" ||
          req.status === "assigned" ||
          req.status === "pending_review") && (
          <SectionCard title="قائمة الفحص">
            <ChecklistForm
              reportId={report.id}
              items={report.items}
              editable={req.status === "in_progress"}
            />
          </SectionCard>
        )}

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
          <p className="text-sm text-gray-600 mb-2">{report.overallSummary}</p>
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
