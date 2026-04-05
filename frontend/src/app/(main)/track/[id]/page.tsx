import { notFound } from "next/navigation";
import {
  RequestStatusBadge,
  StatusTimeline,
  ReportChecklistRow,
} from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import {
  getInspectionRequest,
  getHistoryForRequest,
  getReport,
  getReportByRequestId,
  getWorkshop,
  getInspector,
} from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";

const STATUS_AR: Record<string, string> = {
  draft: "مسودة",
  submitted: "تم الإرسال",
  assigned: "تم الإسناد",
  in_progress: "قيد التنفيذ",
  pending_review: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

export default async function CustomerTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  const request = await getInspectionRequest(params.id);
  if (!request) notFound();

  const [history, report, workshop, inspector] = await Promise.all([
    getHistoryForRequest(request.id),
    request.reportId
      ? getReport(request.reportId)
      : getReportByRequestId(request.id),
    request.workshopId ? getWorkshop(request.workshopId) : null,
    request.inspectorId ? getInspector(request.inspectorId) : null,
  ]);

  const isApproved = request.status === "approved";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-500 mb-1">تتبع طلب الفحص</p>
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h2 className="text-lg font-bold">{request.title}</h2>
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      {/* Vehicle info */}
      <SectionCard title="بيانات المركبة">
        <dl className="text-sm space-y-1">
          <div>
            <dt className="text-gray-500">المركبة</dt>
            <dd className="font-medium">{request.vehicleLabel}</dd>
          </div>
          {request.auction_reference && (
            <div>
              <dt className="text-gray-500">مرجع المزاد</dt>
              <dd>{request.auction_reference}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">تاريخ الطلب</dt>
            <dd>{new Date(request.createdAt).toLocaleDateString("ar-SA")}</dd>
          </div>
        </dl>
      </SectionCard>

      {/* Current status summary */}
      <SectionCard title="حالة الطلب الحالية">
        <div
          className="text-center py-4 rounded-lg"
          style={{ backgroundColor: TOKENS.colors.neutral[50] }}
        >
          <p
            className="text-xl font-bold"
            style={{
              color:
                request.status === "approved"
                  ? TOKENS.colors.semantic.success
                  : request.status === "rejected"
                    ? TOKENS.colors.semantic.error
                    : TOKENS.colors.roles.customer.primary,
            }}
          >
            {STATUS_AR[request.status] ?? request.status}
          </p>
          {workshop && (
            <p className="text-sm text-gray-600 mt-2">
              الورشة: {workshop.name}
            </p>
          )}
          {inspector && (
            <p className="text-sm text-gray-600 mt-1">
              المفتش: {inspector.fullName}
            </p>
          )}
        </div>
      </SectionCard>

      {/* Status timeline */}
      <SectionCard title="سجل الحالات">
        <StatusTimeline items={history} />
      </SectionCard>

      {/* Report summary - only when approved */}
      {isApproved && report && (
        <SectionCard title="ملخص تقرير الفحص">
          <p className="text-sm text-gray-800 mb-3">{report.overallSummary}</p>
          {report.approvedAt && (
            <p className="text-xs text-gray-500 mb-4">
              تاريخ الاعتماد:{" "}
              {new Date(report.approvedAt).toLocaleDateString("ar-SA")}
            </p>
          )}
          <div className="space-y-3">
            {report.items.map((item) => (
              <ReportChecklistRow key={item.id} item={item} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Not approved yet message */}
      {!isApproved && request.status !== "rejected" && (
        <SectionCard>
          <EmptyState
            title="التقرير قيد الإعداد"
            description="سيظهر تقرير الفحص هنا بعد اعتماده من قبل إدارة الفحص."
          />
        </SectionCard>
      )}

      {/* Rejected message */}
      {request.status === "rejected" && report?.rejectionReason && (
        <SectionCard title="سبب الرفض">
          <p className="text-sm text-red-700">{report.rejectionReason}</p>
        </SectionCard>
      )}
    </div>
  );
}
