import Link from "next/link";
import { cookies, headers } from "next/headers";
import { CarFront, ChevronLeft, Gauge, Wrench } from "lucide-react";
import { EmptyState, SectionCard } from "@/components/shared";
import { MaintenanceReminders } from "@/components/inspection/MaintenanceReminders";
import { getInspectionBearerToken } from "@/lib/auth/inspection-session-token.server";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { fetchMyGarage } from "@/lib/core/fetch-my-garage";
import { listInspectionRequestsForDasmUser } from "@/lib/data/inspection";
import { listVehicleMaintenanceRecordsForUser } from "@/lib/data/vehicle-maintenance-records";
import { listVehicleObdScansForUser } from "@/lib/data/vehicle-obd-scans";

export default async function MyVehiclesPage() {
  const persona = resolveInspectionPersona(await headers(), await cookies());
  if (persona.persona !== "dasm_user") {
    return (
      <SectionCard>
        <EmptyState
          title="هذه المساحة لملاك المركبات"
          description="طلبات الورشة والفاحص متاحة من مساحة العمل المخصصة لدورك."
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
          description="سجّل الدخول بحساب DASM لعرض مركباتك وسجلها الفني."
        />
      </SectionCard>
    );
  }

  const [garage, requests, maintenance, obdScans] = await Promise.all([
    fetchMyGarage(token),
    listInspectionRequestsForDasmUser(uid, {}),
    listVehicleMaintenanceRecordsForUser(uid),
    listVehicleObdScansForUser(uid),
  ]);

  const countFor = (carId: string) => ({
    inspections: requests.filter((item) => item.dasm_car_id === carId).length,
    maintenance: maintenance.filter((item) => item.dasmCarId === carId).length,
    scans: obdScans.filter((item) => item.dasmCarId === carId).length,
  });

  return (
    <div className="space-y-5" dir="rtl">
      <header className="border-b border-gray-200 pb-5 dark:border-slate-800">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#178847]">
          <CarFront className="h-4 w-4" aria-hidden />
          الملكية والسجل الفني
        </div>
        <h1 className="text-2xl font-bold text-gray-950 dark:text-white">
          مركباتي
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          مركبات حسابك المركزي وسجل الفحوص والصيانة المرتبط بكل مركبة.
        </p>
      </header>

      {garage === null ? (
        <SectionCard>
          <EmptyState
            title="تعذّر تحميل مركباتك"
            description="مصدر مركبات DASM المركزي غير متاح الآن. حاول مجدداً بعد قليل."
          />
        </SectionCard>
      ) : garage.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="لا توجد مركبات في حسابك"
            description="عند إضافة مركبة إلى حساب DASM ستظهر هنا تلقائياً."
          />
        </SectionCard>
      ) : (
        <section aria-labelledby="vehicles-heading">
          <h2 id="vehicles-heading" className="sr-only">
            قائمة المركبات
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {garage.map((vehicle) => {
              const counts = countFor(vehicle.id);
              const odometer = vehicle.odometer
                ? `${vehicle.odometer} ${vehicle.odometerUnit === "mi" ? "ميل" : "كم"}`
                : null;
              const secondary = [vehicle.plate, odometer]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={vehicle.id}>
                  <Link
                    href={`/my-vehicles/${encodeURIComponent(vehicle.id)}`}
                    className="group flex min-h-28 items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-[#0B3266]/40 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#EAF2FA] text-[#0B3266] dark:bg-slate-800 dark:text-sky-300">
                      <CarFront className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-gray-950 dark:text-white">
                        {vehicle.title}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">
                        {secondary || "سجل مركبة DASM"}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Wrench className="h-3.5 w-3.5" aria-hidden />
                          {counts.maintenance} صيانة
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" aria-hidden />
                          {counts.scans} تشخيص
                        </span>
                        <span>{counts.inspections} فحص</span>
                      </span>
                    </span>
                    <ChevronLeft
                      className="h-5 w-5 text-gray-400 transition group-hover:text-[#0B3266]"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <MaintenanceReminders records={maintenance} />
    </div>
  );
}
