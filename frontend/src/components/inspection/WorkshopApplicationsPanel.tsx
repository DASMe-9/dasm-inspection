import {
  approveWorkshopApplicationFormAction,
  rejectWorkshopApplicationFormAction,
} from "@/app/actions/workshop-admin";
import { SectionCard } from "@/components/shared";
import { listPendingWorkshopApplications } from "@/lib/data/workshop-applications-data";

export async function WorkshopApplicationsPanel() {
  const applications = await listPendingWorkshopApplications();

  return (
    <SectionCard title="طلبات انضمام الورش">
      {applications.length === 0 ? (
        <p className="text-sm text-gray-500">لا توجد طلبات بانتظار المراجعة.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-gray-100 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {a.workshopName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {a.city} · {a.contactName} · {a.phone}
                    {a.email ? ` · ${a.email}` : ""}
                  </p>
                  {a.commercialRegistration && (
                    <p className="mt-1 text-xs text-gray-500">
                      سجل تجاري: {a.commercialRegistration}
                    </p>
                  )}
                  {a.notes && (
                    <p className="mt-1 text-xs text-gray-600">{a.notes}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={approveWorkshopApplicationFormAction}>
                    <input type="hidden" name="application_id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      اعتماد وإنشاء الورشة
                    </button>
                  </form>
                  <form action={rejectWorkshopApplicationFormAction}>
                    <input type="hidden" name="application_id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                    >
                      رفض
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
