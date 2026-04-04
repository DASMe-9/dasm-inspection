import { SectionCard } from "@/components/shared";
import type { AppRole } from "@/types";

const ROLES: { id: AppRole; label: string }[] = [
  { id: "super_admin", label: "مشرف عام" },
  { id: "inspection_admin", label: "إدارة الفحص" },
  { id: "workshop_manager", label: "مدير ورشة" },
  { id: "inspector", label: "مفتش" },
  { id: "viewer", label: "عرض فقط" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-lg font-bold text-gray-800">الإعدادات</h2>

      <SectionCard title="الأدوار (V1)">
        <ul className="text-sm space-y-2">
          {ROLES.map((r) => (
            <li key={r.id} className="flex justify-between gap-2">
              <span>{r.label}</span>
              <code className="text-xs text-gray-500">{r.id}</code>
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          الصلاحيات الفعلية تُفرض عبر DASM / JWT عند الربط.
        </p>
      </SectionCard>

      <SectionCard title="التكامل">
        <p className="text-sm text-gray-600">
          هذا التطبيق مستقل في الريبو ويستهلك معرفات DASM (
          <code className="text-xs">dasm_car_id</code>،{" "}
          <code className="text-xs">dasm_user_id</code>
          ). راجع <code className="text-xs">docs/DASM_INTEGRATION.md</code>.
        </p>
      </SectionCard>
    </div>
  );
}
