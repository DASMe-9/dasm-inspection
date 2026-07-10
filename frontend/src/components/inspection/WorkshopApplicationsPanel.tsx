import {
  approveWorkshopApplicationFormAction,
  rejectWorkshopApplicationFormAction,
} from "@/app/actions/workshop-admin";
import { SectionCard } from "@/components/shared";
import { listPendingWorkshopApplications } from "@/lib/data/workshop-applications-data";

const cardClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "mt-1 w-full max-w-[10rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export async function WorkshopApplicationsPanel() {
  const applications = await listPendingWorkshopApplications();

  return (
    <SectionCard title="طلبات انضمام الورش">
      {applications.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          لا توجد طلبات بانتظار المراجعة.
        </p>
      ) : (
        <div className="space-y-3">
          {applications.map((a) => {
            const linked = Boolean(a.dasmUserId?.trim());
            return (
              <div key={a.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {a.workshopName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {a.city} · {a.contactName} · {a.phone}
                      {a.email ? ` · ${a.email}` : ""}
                    </p>
                    {a.commercialRegistration ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        سجل تجاري: {a.commercialRegistration}
                      </p>
                    ) : null}
                    {a.notes ? (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {a.notes}
                      </p>
                    ) : null}
                    <p
                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        linked
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      }`}
                    >
                      {linked
                        ? `حساب داسم مربوط: ${a.dasmUserId}`
                        : "بدون حساب داسم — أدخل المالك يدوياً عند الاعتماد"}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <form
                      action={approveWorkshopApplicationFormAction}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="application_id" value={a.id} />
                      {!linked ? (
                        <label className="text-[10px] text-slate-500 dark:text-slate-400">
                          owner_user_id
                          <input
                            name="owner_user_id"
                            dir="ltr"
                            className={inputClass}
                            placeholder="322"
                          />
                        </label>
                      ) : null}
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      >
                        اعتماد وإنشاء الورشة
                      </button>
                    </form>
                    <form action={rejectWorkshopApplicationFormAction}>
                      <input type="hidden" name="application_id" value={a.id} />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 sm:w-auto"
                      >
                        رفض
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
