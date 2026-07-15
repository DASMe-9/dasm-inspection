import { toggleWorkshopSuspensionFormAction } from "@/app/actions/workshop-admin";
import { SectionCard } from "@/components/shared";
import { WorkshopNavPreferencesPanel } from "@/components/workshop/WorkshopNavPreferencesPanel";
import { parseHiddenNavKeys } from "@/lib/auth/workshop-nav-preferences";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";
import { listWorkshops } from "@/lib/data/inspection";

export async function WorkshopAdminModerationPanel() {
  const workshops = await listWorkshops();

  return (
    <SectionCard title="إدارة الورش (ثقة الشريط والأدوات)">
      <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
        إيقاف الورشة أو تخصيص ما يظهر لصاحبها في الشريط الجانبي — تحكم إشرافي
        علوي، وليس بيد الورشة.
      </p>
      <div className="space-y-4">
        {workshops.map((w) => (
          <div
            key={w.id}
            className="space-y-3 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {w.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  {w.city} · {w.isVerified ? "معتمدة" : "قيد المراجعة"}
                  {w.isSuspended ? " · موقوفة" : ""}
                </p>
                {w.suspensionReason && (
                  <p className="mt-2 text-xs text-red-700 dark:text-red-400">
                    سبب الإيقاف: {w.suspensionReason}
                  </p>
                )}
              </div>
              {w.isSuspended ? (
                <form action={toggleWorkshopSuspensionFormAction}>
                  <input type="hidden" name="workshop_id" value={w.id} />
                  <input type="hidden" name="action" value="restore" />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    إعادة تفعيل
                  </button>
                </form>
              ) : (
                <form
                  action={toggleWorkshopSuspensionFormAction}
                  className="flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="workshop_id" value={w.id} />
                  <input type="hidden" name="action" value="suspend" />
                  <input
                    name="suspension_reason"
                    placeholder="سبب الإيقاف"
                    className="min-w-[12rem] rounded-lg border border-gray-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                  >
                    إيقاف
                  </button>
                </form>
              )}
            </div>

            <WorkshopNavPreferencesPanel
              workshopId={w.id}
              workshopName={w.name}
              hiddenNavKeys={
                parseHiddenNavKeys(w.sidebarHiddenNavKeys) as InspectionNavKey[]
              }
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
