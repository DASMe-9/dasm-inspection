"use client";

import Link from "next/link";
import type { InspectionRequest } from "@/types";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";

export function RequestCard({ request }: { request: InspectionRequest }) {
  const { colors } = useTheme({ role: "workshop" });

  return (
    <Link
      href={`/requests/${request.id}`}
      className={cn(
        "block rounded-lg border p-4 bg-white hover:shadow-md transition-shadow"
      )}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-bold" style={{ color: colors.primary }}>
            {request.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{request.vehicleLabel}</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            dasm_car_id: {request.dasm_car_id}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
    </Link>
  );
}
