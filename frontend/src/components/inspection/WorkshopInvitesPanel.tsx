import { WorkshopInviteCreateForm } from "@/components/inspection/WorkshopInviteCreateForm";
import { SectionCard } from "@/components/shared";
import { listPendingWorkshopInvites } from "@/lib/data/workshop-invites-data";

export async function WorkshopInvitesPanel() {
  const invites = await listPendingWorkshopInvites();

  return (
    <SectionCard title="دعوات انضمام الورش">
      <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        أنشئ رابط دعوة مسبق الإعداد — عند فتحه يُعبَّأ النموذج ويُربط حساب داسم
        تلقائياً بعد تسجيل الدخول والتقديم.
      </p>
      <WorkshopInviteCreateForm />
      {invites.length > 0 ? (
        <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            دعوات نشطة ({invites.length})
          </p>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-800/60"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {inv.workshopName} · {inv.city}
                </p>
                <p className="mt-0.5 break-all font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                  /workshops/apply?invite={inv.token}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  );
}
