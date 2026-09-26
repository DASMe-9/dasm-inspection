import Link from "next/link";
import { cookies, headers } from "next/headers";
import {
  ExternalReportVault,
  RequestCard,
  VehicleMaintenanceLog,
  VehicleObdScanLog,
} from "@/components/inspection";
import { MaintenanceReminders } from "@/components/inspection/MaintenanceReminders";
import { EmptyState, SectionCard } from "@/components/shared";
import { getInspectionBearerToken } from "@/lib/auth/inspection-session-token.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { fetchMyGarage } from "@/lib/core/fetch-my-garage";
import { listExternalVehicleReportsForUser } from "@/lib/data/external-vehicle-reports";
import { listInspectionRequestsForDasmUser } from "@/lib/data/inspection";
import { listVehicleMaintenanceRecordsForCar } from "@/lib/data/vehicle-maintenance-records";
import { listVehicleObdScansForCar } from "@/lib/data/vehicle-obd-scans";

export default async function VehicleFilePage({
  params,
}: {
  params: { carId: string };
}) {
  const carId = decodeURIComponent(params.carId);
  const persona = resolveInspectionPersona(await headers(), await cookies());
  if (persona.persona !== "dasm_user") {
    return (
      <SectionCard>
        <EmptyState
          title="هذه المساحة لملاك المركبات"
          description="لا يتيح دورك الحالي الوصول إلى ملفات مركبات العملاء."
        />
      </SectionCard>
    );
  }

  const [uid, token] = await Promise.all([
    resolveDasmUserId(),
    getInspectionBearerToken(),
  ]);

  if (!uid || !token) {
    return (
      <SectionCard>
        <EmptyState
          title="لم نعثر على حسابك"
          description="سجّل الدخول بحساب DASM لعرض ملف المركبة."
        />
      </SectionCard>
    );
  }

  const garage = await fetchMyGarage(token);
  const vehicle = garage?.find((item) => item.id === carId);
  if (!vehicle) {
    return (
      <SectionCard>
        <EmptyState
          title="المركبة غير متاحة"
          description="لا تظهر هذه المركبة ضمن ملكيتك الحالية في DASM."
        />
      </SectionCard>
    );
  }

  const [requests, maintenance, obdScans, externalReports] = await Promise.all([
    listInspectionRequestsForDasmUser(uid, {}),
    listVehicleMaintenanceRecordsForCar(carId),
    listVehicleObdScansForCar(carId),
    listExternalVehicleReportsForUser(uid),
  ]);
  const carRequests = requests.filter((item) => item.dasm_car_id === carId);
  const ownExternalReports = externalReports.filter(
    (item) => item.dasmCarId === carId
  );
  const empty =
    carRequests.length === 0 &&
    maintenance.length === 0 &&
    obdScans.length === 0 &&
    ownExternalReports.length === 0;

  return (
    <div className="space-y-5" dir="rtl">
      <header className="border-b border-gray-200 pb-5 dark:border-slate-800">
        <Link
          href="/my-vehicles"
          className="text-xs font-bold text-[#178847] hover:underline"
        >
          العودة إلى مركباتي
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
          {vehicle.title}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          السجل الفني الدائم للمركبة: الفحوص والصيانة وقراءات التشخيص.
        </p>
      </header>

      {empty ? (
        <SectionCard>
          <EmptyState
            title="لا سجلات لهذه المركبة"
            description="ستظهر هنا فحوصها وصيانتها وقراءاتها الفنية عند تسجيلها."
          />
        </SectionCard>
      ) : (
        <>
          <MaintenanceReminders records={maintenance} />
          {carRequests.length > 0 && (
            <SectionCard title={`طلبات الفحص (${carRequests.length})`}>
              <div className="space-y-3">
                {carRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </SectionCard>
          )}
          <VehicleMaintenanceLog records={maintenance} />
          <VehicleObdScanLog scans={obdScans} />
          <ExternalReportVault reports={ownExternalReports} />
        </>
      )}
    </div>
  );
}
