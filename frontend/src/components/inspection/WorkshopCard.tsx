"use client";

import Link from "next/link";
import type { Workshop } from "@/types";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";
import { WorkshopPricingBadges } from "@/components/inspection/WorkshopPricingBadges";
import { BadgeCheck, Building2, ChevronLeft, MapPin, Star } from "lucide-react";

export function WorkshopCard({
  workshop,
  rating,
}: {
  workshop: Workshop;
  rating?: { average: number; count: number } | null;
}) {
  const { colors } = useTheme({ role: "workshop" });

  return (
    <Link
      href={`/workshops/${workshop.slug}`}
      prefetch
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-white p-5 shadow-sm ring-1 ring-black/[0.04]",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-violet-200/80"
      )}
      style={{ borderColor: `${colors.primary}22` }}
      dir="rtl"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l opacity-95 transition-opacity group-hover:opacity-100"
        style={{
          backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.accent}, ${colors.primary})`,
        }}
      />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 text-[#1E74E8]/90">
            <Building2 className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            <h3
              className="truncate text-base font-bold md:text-lg"
              style={{ color: colors.primary }}
            >
              {workshop.name}
            </h3>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            <span>{workshop.city}</span>
          </p>
          {rating && (
            <p className="flex items-center gap-1 text-xs font-semibold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden />
              {rating.average}
              <span className="font-normal text-gray-500">({rating.count})</span>
            </p>
          )}
          {workshop.isFeatured && (
            <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800 ring-1 ring-violet-100">
              {workshop.featuredProgramLabel ?? "برنامج مميز"}
            </span>
          )}
          {workshop.dasm_partner_ref && (
            <p className="truncate text-xs text-gray-500">{workshop.dasm_partner_ref}</p>
          )}
          <div className="pt-2">
            <WorkshopPricingBadges pricing={workshop.pricing} compact />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {workshop.isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              معتمد داسم
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-100">
              قيد المراجعة
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E74E8] opacity-90 transition group-hover:opacity-100"
            style={{ color: colors.primary }}
          >
            التفاصيل
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
