import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  ExternalReportVault,
  RequestCard,
  RequestListFilters,
  VehicleMaintenanceLog,
  VehicleObdScanLog,
} from "@/components/inspection";
import { EmptyState, SectionCard } from "@/components/shared";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { buildRequestListScope } from "@/lib/auth/request-list-scope.server";
import { InspectionNotificationsPanel } from "@/components/inspection/InspectionNotificationsPanel";
import { MaintenanceReminders } from "@/components/inspection/MaintenanceReminders";
import {
  listInspectionRequestsForDasmUser,
  listWorkshops,
} from "@/lib/data/inspection";
import { listExternalVehicleReportsForUser } from "@/lib/data/external-vehicle-reports";
import { listVehicleMaintenanceRecordsForUser } from "@/lib/data/vehicle-maintenance-records";
import { listVehicleObdScansForUser } from "@/lib/data/vehicle-obd-scans";
import { listNotificationsForUser } from "@/lib/data/workshop-follows-data";

export default async function MyInspectionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const c = cookies();
  const uid = c.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? "";
  const workshops = await listWorkshops();
  const workshopOptions = workshops.map((w) => ({ id: w.id, name: w.name }));
  const scope = await buildRequestListScope(searchParams, workshopOptions);

  const [list, notifications, externalReports, maintenanceRecords, obdScans] = uid
    ? await Promise.all([
        listInspectionRequestsForDasmUser(uid, scope.listOpts),
        listNotificationsForUser(uid),
        listExternalVehicleReportsForUser(uid),
        listVehicleMaintenanceRecordsForUser(uid),
        listVehicleObdScansForUser(uid),
      ])
    : [[], [], [], [], []];

  return (
    <div className="space-y-5 md:space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
          طلباتي
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          الطلبات المرتبطة بحسابك عند الدخول عبر بوابة منصّة داسم.
        </p>
      </div>

      {!uid ? (
        <SectionCard>
          <EmptyState
            title="لم نعثر على حسابك"
            description="افتح رابط الدخول من منصّة داسم (GET /api/gateway?token=…) لعرض الطلبات المرتبطة بك."
            action={
              <Link
                href="/requests"
                className="text-sm font-medium text-indigo-600 hover:underline min-h-[44px] inline-flex items-center"
              >
                الانتقال إلى طلبات الفحص →
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <>
          <MaintenanceReminders records={maintenanceRecords} />
          <VehicleMaintenanceLog records={maintenanceRecords} />
          <VehicleObdScanLog scans={obdScans} />
          <ExternalReportVault reports={externalReports} />
          <InspectionNotificationsPanel notifications={notifications} />
          <Suspense
            fallback={
              <div
                className="h-14 animate-pulse rounded-xl bg-gray-100/80"
                aria-hidden
              />
            }
          >
            <RequestListFilters
              workshopOptions={scope.workshopOptions}
              lockedWorkshopId={scope.lockedWorkshopId}
              lockedWorkshopName={scope.lockedWorkshopName}
              showWorkshopFilter={scope.showWorkshopFilter}
              showServiceModeFilter={scope.showServiceModeFilter}
              resultCount={list.length}
            />
          </Suspense>

          {list.length === 0 ? (
            <SectionCard>
              <EmptyState
                title="لا طلبات بهذه الحالة"
                description="غيّر الفلتر أو أنشئ طلب فحص جديد من صفحة الطلبات ليرتبط بحسابك."
                action={
                  <Link
                    href="/requests"
                    className="inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    إنشاء طلب فحص
                  </Link>
                }
              />
            </SectionCard>
          ) : (
            <div className="space-y-3">
              {list.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
