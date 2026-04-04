import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportChecklistRow, RequestStatusBadge } from "@/components/inspection";
import { SectionCard } from "@/components/shared";
import {
  getInspector,
  getReport,
  getInspectionRequest,
  getWorkshop,
} from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";
import type { AppRole } from "@/types";

const ROLE_AR: Record<AppRole, string> = {
  super_admin: "مشرف عام",
  inspection_admin: "إدارة الفحص",
  workshop_manager: "مدير ورشة",
  workshop_owner: "مالك ورشة",
  mechanic: "فني",
  inspector: "مفتش",
  viewer: "مشاهد",
  dasm_user: "مستخدم DASM",
};

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) notFound();

  const req = await getInspectionRequest(report.requestId);
  const workshop = await getWorkshop(report.workshopId);
  const inspector = await getInspector(report.inspectorId);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-lg font-bold">تقرير الفحص</h2>
        {req && (
          <p className="text-sm text-gray-600 mt-1">
            الطلب: {req.title}
            <span className="mx-2 inline-block align-middle">
              <RequestStatusBadge status={req.status} />
            </span>
          </p>
        )}
      </div>

      <SectionCard title="ملخص">
        <p className="text-sm text-gray-800">{report.overallSummary}</p>
        <dl className="text-sm mt-3 space-y-1 text-gray-600">
          <div>
            <dt className="text-gray-500 inline">الورشة: </dt>
            <dd className="inline">{workshop?.name ?? report.workshopId}</dd>
          </div>
          <div>
            <dt className="text-gray-500 inline">المفتش: </dt>
            <dd className="inline">{inspector?.fullName ?? report.inspectorId}</dd>
          </div>
          <div>
            <dt className="text-gray-500 inline">تقديم: </dt>
            <dd className="inline">
              {new Date(report.submittedAt).toLocaleString("ar-SA")}
            </dd>
          </div>
          {report.approvedAt && (
            <div>
              <dt className="text-gray-500 inline">اعتماد: </dt>
              <dd className="inline">
                {new Date(report.approvedAt).toLocaleString("ar-SA")}
                {report.approvedByRole && (
                  <span className="text-gray-500">
                    {" "}
                    ({ROLE_AR[report.approvedByRole]})
                  </span>
                )}
              </dd>
            </div>
          )}
          {report.rejectionReason && (
            <div className="text-red-700">
              سبب الرفض: {report.rejectionReason}
            </div>
          )}
        </dl>
      </SectionCard>

      <SectionCard title="بنود الفحص">
        <div className="space-y-3">
          {report.items.map((item) => (
            <ReportChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </SectionCard>

      {req && (
        <Link
          href={`/requests/${req.id}`}
          className="inline-block text-sm font-medium"
          style={{ color: TOKENS.colors.roles.workshop.primary }}
        >
          ← العودة لطلب الفحص
        </Link>
      )}
    </div>
  );
}
