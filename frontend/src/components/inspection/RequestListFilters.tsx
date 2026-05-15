"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  INSPECTION_REQUEST_STATUS_LABELS,
  INSPECTION_REQUEST_STATUS_VALUES,
} from "@/lib/inspection-request-list-options";

/**
 * تحكم في query: `status`، `sort` (updated افتراضي، أو created).
 * يحافظ على باقي المعاملات (مثل gateway و dasm_user_id).
 */
export function RequestListFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const replaceQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(patch)) {
        if (val === null || val === "") p.delete(key);
        else p.set(key, val);
      }
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") === "created" ? "created" : "updated";

  const statusOptions = useMemo(
    () =>
      INSPECTION_REQUEST_STATUS_VALUES.map((value) => ({
        value,
        label: INSPECTION_REQUEST_STATUS_LABELS[value],
      })),
    []
  );

  return (
    <div
      className="flex flex-wrap items-end gap-3 md:gap-4"
      dir="rtl"
      role="search"
      aria-label="فرز وفلترة طلبات الفحص"
    >
      <div className="flex min-w-[140px] flex-1 flex-col gap-1">
        <label
          htmlFor="inspection-filter-status"
          className="text-xs font-medium text-gray-500"
        >
          الحالة
        </label>
        <select
          id="inspection-filter-status"
          value={status}
          onChange={(e) => {
            const v = e.target.value;
            replaceQuery({ status: v ? v : null });
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">كل الحالات</option>
          {statusOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-[140px] flex-1 flex-col gap-1">
        <label
          htmlFor="inspection-filter-sort"
          className="text-xs font-medium text-gray-500"
        >
          الفرز
        </label>
        <select
          id="inspection-filter-sort"
          value={sort}
          onChange={(e) => {
            const v = e.target.value;
            replaceQuery({
              sort: v === "created" ? "created" : null,
            });
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="updated">آخر تحديث</option>
          <option value="created">تاريخ الإنشاء</option>
        </select>
      </div>
    </div>
  );
}
