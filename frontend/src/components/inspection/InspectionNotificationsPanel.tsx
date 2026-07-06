import { markNotificationReadAction } from "@/app/actions/workshop-follows";
import { SectionCard } from "@/components/shared";
import type { InspectionNotification } from "@/types";

export function InspectionNotificationsPanel({
  notifications,
}: {
  notifications: InspectionNotification[];
}) {
  const unread = notifications.filter((n) => !n.readAt);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <SectionCard title="التنبيهات">
      {unread.length > 0 && (
        <p className="mb-3 text-xs font-medium text-[#1857b8]">
          {unread.length} غير مقروء
        </p>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border px-3 py-2.5 text-sm ${
              n.readAt
                ? "border-gray-100 bg-gray-50/50 text-gray-600"
                : "border-violet-100 bg-violet-50/40 text-gray-900"
            }`}
          >
            <p className="font-semibold">{n.title}</p>
            {n.body && <p className="mt-1 text-xs leading-relaxed">{n.body}</p>}
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-400">
                {new Date(n.createdAt).toLocaleString("ar-SA")}
              </span>
              {!n.readAt && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="notification_id" value={n.id} />
                  <button
                    type="submit"
                    className="text-[10px] font-semibold text-[#1E74E8] hover:underline"
                  >
                    تعليم كمقروء
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
