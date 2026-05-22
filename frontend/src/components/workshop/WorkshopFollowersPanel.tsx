import { SectionCard } from "@/components/shared";
import type { WorkshopFollower } from "@/types/workshop-insights";

export function WorkshopFollowersPanel({
  followers,
}: {
  followers: WorkshopFollower[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        مستخدمون داسم يتابعون تحديثات ورشتك (إشعارات داخل التطبيق عند نشر
        تقييمات معتمدة أو تحديثات).
      </p>

      {followers.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-gray-600">لا متابعون مسجّلون بعد.</p>
        </SectionCard>
      ) : (
        <SectionCard title={`المتابعون (${followers.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="py-2 font-semibold">معرف مستخدم داسم</th>
                  <th className="py-2 font-semibold">تاريخ المتابعة</th>
                </tr>
              </thead>
              <tbody>
                {followers.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50">
                    <td className="py-2.5 font-mono text-xs text-gray-800">
                      {f.dasmUserId}
                    </td>
                    <td className="py-2.5 text-gray-600">
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
