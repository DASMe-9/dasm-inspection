import { toggleWorkshopSuspensionFormAction } from "@/app/actions/workshop-admin";
import { SectionCard } from "@/components/shared";
import { listWorkshops } from "@/lib/data/inspection";

export async function WorkshopAdminModerationPanel() {
  const workshops = await listWorkshops();

  return (
    <SectionCard title="إدارة ثقة الورش">
      <div className="space-y-3">
        {workshops.map((w) => (
          <div
            key={w.id}
            className="rounded-xl border border-gray-100 bg-white px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{w.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {w.city} · {w.isVerified ? "معتمدة" : "قيد المراجعة"}
                  {w.isSuspended ? " · موقوفة" : ""}
                </p>
                {w.suspensionReason && (
                  <p className="mt-2 text-xs text-red-700">
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
                    className="min-w-[12rem] rounded-lg border border-gray-200 px-2 py-1 text-xs"
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
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
