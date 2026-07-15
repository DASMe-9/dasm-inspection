"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import {
  mapsUrlFromNationalAddress,
} from "@/lib/workshop-location";

export function WorkshopLocationFields({
  initialNationalAddress,
  initialMapLink,
}: {
  initialNationalAddress?: string;
  initialMapLink?: string;
}) {
  const [nationalAddress, setNationalAddress] = useState(
    initialNationalAddress ?? ""
  );

  const mapLink = useMemo(() => {
    const fromCode = mapsUrlFromNationalAddress(nationalAddress);
    if (fromCode) return fromCode;
    return initialMapLink?.trim() || "";
  }, [nationalAddress, initialMapLink]);

  return (
    <>
      <label className="block">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          رمز العنوان الوطني
        </span>
        <input
          name="national_address_code"
          value={nationalAddress}
          onChange={(e) =>
            setNationalAddress(e.target.value.toUpperCase().replace(/\s+/g, ""))
          }
          dir="ltr"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-left font-mono text-sm dark:border-slate-600 dark:bg-slate-800"
          placeholder="مثال: RRRD2929"
          autoComplete="off"
        />
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
          عند إدخال الرمز يُنشأ رابط الموقع تلقائياً.
        </span>
      </label>

      <div className="block">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          رابط الموقع
        </span>
        <input type="hidden" name="map_link" value={mapLink} />
        {mapLink ? (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
          >
            <span className="inline-flex items-center gap-2">
              <Navigation className="h-4 w-4 shrink-0" aria-hidden />
              اضغط لفتح الموقع في الخرائط / GPS
            </span>
            <MapPin className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          </a>
        ) : (
          <div className="mt-1 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
            أدخل رمز العنوان الوطني أولاً ليظهر رابط الموقع هنا.
          </div>
        )}
      </div>
    </>
  );
}
