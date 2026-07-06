import Link from "next/link";
import { RequestStatusBadge } from "@/components/inspection/RequestStatusBadge";
import { SectionCard } from "@/components/shared";
import {
  hasFieldMapCoordinates,
  openStreetMapEmbedUrl,
  openStreetMapPinUrl,
  openStreetMapSearchUrl,
} from "@/lib/field-schedule";
import type { InspectionRequest } from "@/types";
import { MapPin, Navigation } from "lucide-react";

export function WorkshopFieldMapPanel({
  workshopCity,
  requests,
}: {
  workshopCity: string;
  requests: InspectionRequest[];
}) {
  const withCoords = requests.filter(hasFieldMapCoordinates);
  const addressOnly = requests.filter((r) => !hasFieldMapCoordinates(r));
  const primary = withCoords[0];

  return (
    <div className="space-y-4">
      <SectionCard title="خريطة التشغيل الميداني">
        <p className="text-sm text-gray-600 mb-4">
          المواقع ذات الإحداثيات تظهر على الخريطة. باقي الطلبات تفتح عبر بحث
          OpenStreetMap حسب العنوان ({workshopCity}).
        </p>

        {primary &&
          primary.fieldServiceLat != null &&
          primary.fieldServiceLng != null && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
              <iframe
                title={`خريطة — ${primary.vehicleLabel}`}
                src={openStreetMapEmbedUrl(
                  primary.fieldServiceLat,
                  primary.fieldServiceLng
                )}
                className="h-64 w-full border-0 md:h-80"
                loading="lazy"
              />
              <p className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
                معاينة: {primary.vehicleLabel} —{" "}
                <a
                  href={openStreetMapPinUrl(
                    primary.fieldServiceLat,
                    primary.fieldServiceLng
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#1E74E8] hover:underline"
                >
                  فتح بملء الشاشة
                </a>
              </p>
            </div>
          )}

        {requests.length === 0 ? (
          <p className="text-sm text-gray-600">
            لا توجد طلبات ميدانية بعنوان خدمة بعد.
          </p>
        ) : (
          <ul className="space-y-3">
            {withCoords.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                    <Link
                      href={`/requests/${r.id}`}
                      className="hover:text-[#1857b8] hover:underline"
                    >
                      {r.vehicleLabel}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600 truncate">
                    {r.fieldServiceAddress}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-gray-500">
                    {r.fieldServiceLat}, {r.fieldServiceLng}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RequestStatusBadge status={r.status} />
                  <a
                    href={openStreetMapPinUrl(
                      r.fieldServiceLat!,
                      r.fieldServiceLng!
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    <Navigation className="h-3.5 w-3.5" aria-hidden />
                    الخريطة
                  </a>
                </div>
              </li>
            ))}
            {addressOnly.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    <Link
                      href={`/requests/${r.id}`}
                      className="hover:text-[#1857b8] hover:underline"
                    >
                      {r.vehicleLabel}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {r.fieldServiceAddress}
                  </p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    أضف إحداثيات من التقويم لإظهار الدبوس على الخريطة.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RequestStatusBadge status={r.status} />
                  <a
                    href={openStreetMapSearchUrl(
                      `${r.fieldServiceAddress}, ${workshopCity}, Saudi Arabia`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E74E8] hover:underline"
                  >
                    <Navigation className="h-3.5 w-3.5" aria-hidden />
                    بحث العنوان
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
