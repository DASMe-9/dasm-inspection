import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RequestStatusBadge,
  StatusTimeline,
  ChecklistForm,
  RequestWorkflowPanel,
} from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import {
  getAttachmentsForRequest,
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
  const attachments = await getAttachmentsForRequest(req.id);
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 className="text-lg font-bold">{req.title}</h2>
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
        <dl className="text-sm space-y-1">
          <div>
            <dt className="text-gray-500">dasm_car_id</dt>
            <dd className="font-mono">{req.dasm_car_id}</dd>
          </div>
          {req.dasm_user_id && (
            <div>
              <dt className="text-gray-500">dasm_user_id</dt>
              <dd className="font-mono">{req.dasm_user_id}</dd>
            </div>
          )}
          {req.auction_reference && (
            <div>
              <dt className="text-gray-500">مرجع مزاد</dt>
              <dd>{req.auction_reference}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">المركبة</dt>
            <dd>{req.vehicleLabel}</dd>
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

      {report && (req.status === "in_progress" || req.status === "assigned" || req.status === "pending_review") && (
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

      <SectionCard title="المرفقات">
        {attachments.length === 0 ? (
          <EmptyState
            title="لا مرفقات"
            description="اربط حاوية التخزين لاحقاً لرفع الملفات."
          />
        ) : (
          <ul className="text-sm space-y-1">
            {attachments.map((a) => (
              <li key={a.id} className="font-mono text-gray-700">
                {a.fileName}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="mt-3 w-full py-2 rounded-lg border border-dashed text-gray-500 text-sm"
          disabled
        >
          رفع (قريباً)
        </button>
      </SectionCard>

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
