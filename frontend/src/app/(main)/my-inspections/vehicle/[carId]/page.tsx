import Link from "next/link";
import { cookies } from "next/headers";
import {
  ExternalReportVault,
  RequestCard,
  VehicleMaintenanceLog,
  VehicleObdScanLog,
} from "@/components/inspection";
import { MaintenanceReminders } from "@/components/inspection/MaintenanceReminders";
import { EmptyState, SectionCard } from "@/components/shared";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { listInspectionRequestsForDasmUser } from "@/lib/data/inspection";
import { listExternalVehicleReportsForUser } from "@/lib/data/external-vehicle-reports";
import { listVehicleMaintenanceRecordsForUser } from "@/lib/data/vehicle-maintenance-records";
import { listVehicleObdScansForUser } from "@/lib/data/vehicle-obd-scans";

/** الملف الفني المجمّع لسيارة العميل (بياناته هو فقط، مُرشَّحة بمعرّف السيارة). */
export default async function VehicleFilePage({
  params,
}: {
  params: { carId: string };
}) {
  const carId = decodeURIComponent(params.carId);
  const uid = cookies().get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? "";

  if (!uid) {
    return (
      <SectionCard>
        <EmptyState
          title="لم نعثر على حسابك"
          description="افتح الرابط من منصّة داسم لعرض ملف سيارتك الفني."
        />
      </SectionCard>
    );
  }

  const [requests, maintenance, obdScans, externalReports] = await Promise.all([
    listInspectionRequestsForDasmUser(uid, {}),
    listVehicleMaintenanceRecordsForUser(uid),
    listVehicleObdScansForUser(uid),
    listExternalVehicleReportsForUser(uid),
  ]);

  const carRequests = requests.filter((r) => r.dasmCarId === carId);
  const carMaintenance = maintenance.filter((m) => m.dasmCarId === carId);
  const carObd = obdScans.filter((o) => o.dasmCarId === carId);
  const carReports = externalReports.filter((e) => e.dasmCarId === carId);

  const label =
    carMaintenance[0]?.vehicleLabel ??
    carObd[0]?.vehicleLabel ??
    carRequests[0]?.vehicleLabel ??
    carReports[0]?.vehicleLabel ??
    carId;

  const empty =
    carRequests.length === 0 &&
    carMaintenance.length === 0 &&
    carObd.length === 0 &&
    carReports.length === 0;

  return (
    <div className="space-y-5 md:space-y-6" dir="rtl">
      <div>
        <Link
          href="/my-inspections"
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          ← طلباتي
        </Link>
        <h2 className="mt-1 text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
          الملف الفني — {label}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          سجلّ الفحوص والصيانة وقراءات OBD والتقارير لهذه المركبة.
        </p>
      </div>

      {empty ? (
        <SectionCard>
          <EmptyState
            title="لا سجلّات لهذه المركبة"
            description="ستظهر هنا فحوصها وصيانتها وقراءاتها الفنية."
          />
        </SectionCard>
      ) : (
        <>
          <MaintenanceReminders records={carMaintenance} />

          {carRequests.length > 0 && (
            <SectionCard title={`الفحوص (${carRequests.length})`}>
              <div className="space-y-3">
                {carRequests.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </SectionCard>
          )}

          <VehicleMaintenanceLog records={carMaintenance} />
          <VehicleObdScanLog scans={carObd} />
          <ExternalReportVault reports={carReports} />
        </>
      )}
    </div>
  );
}
