import { SectionCard } from "@/components/shared";
import type { WorkshopFollower } from "@/types/workshop-insights";

export function WorkshopFollowersPanel({
  followers,
}: {
  followers: WorkshopFollower[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        مستخدمون داسم يتابعون تحديثات ورشتك (إشعارات داخل التطبيق عند نشر
        تقييمات معتمدة أو تحديثات).
      </p>

      {followers.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            لا متابعون مسجّلون بعد.
          </p>
        </SectionCard>
      ) : (
        <SectionCard title={`المتابعون (${followers.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="py-2 font-semibold">معرف مستخدم داسم</th>
                  <th className="py-2 font-semibold">تاريخ المتابعة</th>
                </tr>
              </thead>
              <tbody>
                {followers.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-2.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {f.dasmUserId}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {new Date(f.createdAt).toLocaleString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
