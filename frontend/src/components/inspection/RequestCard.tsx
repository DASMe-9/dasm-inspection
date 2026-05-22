"use client";

import Link from "next/link";
import type { InspectionRequest } from "@/types";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";
import { serviceModeLabelAr } from "@/lib/request-list-scope";

export function RequestCard({
  request,
  workshopName,
  showServiceMode = false,
}: {
  request: InspectionRequest;
  workshopName?: string;
  showServiceMode?: boolean;
}) {
  const { colors } = useTheme({ role: "workshop" });

  return (
    <Link
      href={`/requests/${request.id}`}
      className={cn(
        "block rounded-xl border p-4 md:p-4 bg-white shadow-sm ring-1 ring-black/[0.04]",
        "hover:shadow-md hover:-translate-y-px transition-all duration-200 active:translate-y-0"
      )}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-bold truncate" style={{ color: colors.primary }}>
            {request.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.vehicleLabel}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            dasm_car_id: {request.dasm_car_id}
          </p>
          {(workshopName || showServiceMode) && (
            <p className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
              {workshopName ? (
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5">
                  {workshopName}
                </span>
              ) : null}
              {showServiceMode ? (
                <span
                  className={
                    request.serviceMode === "field"
                      ? "rounded-md bg-orange-50 px-1.5 py-0.5 text-orange-800"
                      : "rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-800"
                  }
                >
                  {serviceModeLabelAr(request.serviceMode)}
                </span>
              ) : null}
            </p>
          )}
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
    </Link>
  );
}
