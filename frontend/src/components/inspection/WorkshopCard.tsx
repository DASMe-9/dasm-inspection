"use client";

import Link from "next/link";
import type { Workshop } from "@/types";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const { colors } = useTheme({ role: "workshop" });

  return (
    <Link
      href={`/workshops/${workshop.id}`}
      className={cn(
        "block rounded-lg border p-4 bg-white hover:shadow-md transition-shadow"
      )}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold" style={{ color: colors.primary }}>
            {workshop.name}
          </h3>
          <p className="text-sm text-gray-600">{workshop.city}</p>
          {workshop.dasm_partner_ref && (
            <p className="text-xs text-gray-500 mt-1">{workshop.dasm_partner_ref}</p>
          )}
        </div>
        {workshop.isVerified && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            معتمد
          </span>
        )}
      </div>
    </Link>
  );
}
