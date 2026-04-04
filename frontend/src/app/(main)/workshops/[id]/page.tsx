import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionCard } from "@/components/shared";
import { getInspectorsForWorkshop, getWorkshop } from "@/lib/data/inspection";
import { TOKENS } from "@/lib/theme";

export default async function WorkshopDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const w = await getWorkshop(params.id);
  if (!w) notFound();

  const inspectors = await getInspectorsForWorkshop(w.id);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-lg font-bold">{w.name}</h2>
        <p className="text-sm text-gray-600">{w.city}</p>
        {w.dasm_partner_ref && (
          <p className="text-xs text-gray-500 mt-1">{w.dasm_partner_ref}</p>
        )}
      </div>

      <SectionCard title="جهات الاتصال">
        <dl className="text-sm space-y-1">
          {w.phone && (
            <div>
              <dt className="text-gray-500">هاتف</dt>
              <dd>{w.phone}</dd>
            </div>
          )}
          {w.email && (
            <div>
              <dt className="text-gray-500">بريد</dt>
              <dd>{w.email}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">الاعتماد</dt>
            <dd>{w.isVerified ? "معتمد" : "قيد المراجعة"}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="المفتشون">
        {inspectors.length === 0 ? (
          <p className="text-sm text-gray-600">لا مفتشين مرتبطين بهذه الورشة.</p>
        ) : (
          <ul className="text-sm space-y-2">
            {inspectors.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>{i.fullName}</span>
                {i.dasm_user_id && (
                  <span className="font-mono text-xs text-gray-500">
                    {i.dasm_user_id}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Link
        href="/requests"
        className="inline-block text-sm font-medium"
        style={{ color: TOKENS.colors.roles.workshop.primary }}
      >
        عرض طلبات الفحص المرتبطة بالورش ←
      </Link>
    </div>
  );
}
