"use client";

import type { InspectionStatusHistory } from "@/types";
import { TOKENS } from "@/lib/theme";

export function StatusTimeline({ items }: { items: InspectionStatusHistory[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500" dir="rtl">
        لا يوجد سجل حالات بعد.
      </p>
    );
  }

  return (
    <ul className="space-y-3" dir="rtl">
      {items.map((h) => (
        <li
          key={h.id}
          className="flex gap-3 border-r-2 pr-3"
          style={{ borderColor: TOKENS.colors.roles.workshop.primary }}
        >
          <div>
            <p className="text-sm font-medium">{h.status}</p>
            {h.note && <p className="text-xs text-gray-600">{h.note}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(h.createdAt).toLocaleString("ar-SA")} · {h.actorRole}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
