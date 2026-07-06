"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  INSPECTION_REQUEST_STATUS_LABELS,
  INSPECTION_REQUEST_STATUS_VALUES,
  INSPECTION_SERVICE_MODE_LABELS,
} from "@/lib/inspection-request-list-options";
import type { WorkshopFilterOption } from "@/lib/request-list-scope";

export type { WorkshopFilterOption };

export function RequestListFilters({
  workshopOptions = [],
  lockedWorkshopId = null,
  lockedWorkshopName = null,
  showWorkshopFilter = true,
  showServiceModeFilter = true,
  resultCount,
}: {
  workshopOptions?: WorkshopFilterOption[];
  lockedWorkshopId?: string | null;
  lockedWorkshopName?: string | null;
  showWorkshopFilter?: boolean;
  showServiceModeFilter?: boolean;
  resultCount?: number;
}) {
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
  const workshop = lockedWorkshopId ?? searchParams.get("workshop") ?? "";
  const serviceMode = searchParams.get("service_mode") ?? "";

  const statusOptions = useMemo(
    () =>
      INSPECTION_REQUEST_STATUS_VALUES.map((value) => ({
        value,
        label: INSPECTION_REQUEST_STATUS_LABELS[value],
      })),
    []
  );

  const activeChips = useMemo(() => {
    const chips: string[] = [];
    if (status) {
      chips.push(
        INSPECTION_REQUEST_STATUS_LABELS[
          status as keyof typeof INSPECTION_REQUEST_STATUS_LABELS
        ] ?? status
      );
    }
    if (serviceMode === "workshop" || serviceMode === "field") {
      chips.push(INSPECTION_SERVICE_MODE_LABELS[serviceMode]);
    }
    if (lockedWorkshopName) chips.push(lockedWorkshopName);
    else if (workshop) {
      const name = workshopOptions.find((w) => w.id === workshop)?.name;
      if (name) chips.push(name);
    }
    if (sort === "created") chips.push("فرز: تاريخ الإنشاء");
    return chips;
  }, [
    status,
    serviceMode,
    workshop,
    lockedWorkshopName,
    workshopOptions,
    sort,
  ]);

  const hasFilters =
    Boolean(status || serviceMode || workshop || sort === "created");

  return (
    <div className="space-y-3" dir="rtl">
      <div
        className="flex flex-wrap items-end gap-3 md:gap-4"
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

        {showServiceModeFilter ? (
          <div className="flex min-w-[140px] flex-1 flex-col gap-1">
            <label
              htmlFor="inspection-filter-service-mode"
              className="text-xs font-medium text-gray-500"
            >
              نوع الخدمة
            </label>
            <select
              id="inspection-filter-service-mode"
              value={serviceMode}
              onChange={(e) => {
                const v = e.target.value;
                replaceQuery({
                  service_mode:
                    v === "workshop" || v === "field" ? v : null,
                });
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">الكل</option>
              <option value="workshop">
                {INSPECTION_SERVICE_MODE_LABELS.workshop}
              </option>
              <option value="field">
                {INSPECTION_SERVICE_MODE_LABELS.field}
              </option>
            </select>
          </div>
        ) : null}

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

        {lockedWorkshopId ? (
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">الورشة</span>
            <p className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm font-semibold text-violet-900">
              {lockedWorkshopName ?? "ورشتك"}
            </p>
          </div>
        ) : showWorkshopFilter && workshopOptions.length > 0 ? (
          <div className="flex min-w-[160px] flex-1 flex-col gap-1">
            <label
              htmlFor="inspection-filter-workshop"
              className="text-xs font-medium text-gray-500"
            >
              الورشة
            </label>
            <select
              id="inspection-filter-workshop"
              value={workshop}
              onChange={(e) => {
                const v = e.target.value;
                replaceQuery({ workshop: v ? v : null });
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">كل الورش</option>
              {workshopOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {typeof resultCount === "number" ? (
            <>
              <span className="font-semibold text-gray-900">{resultCount}</span>{" "}
              طلب
              {resultCount === 1 ? "" : "ات"}
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((label) => (
            <span
              key={label}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
            >
              {label}
            </span>
          ))}
          {hasFilters ? (
            <button
              type="button"
              onClick={() =>
                replaceQuery({
                  status: null,
                  service_mode: null,
                  workshop: lockedWorkshopId ? null : null,
                  sort: null,
                })
              }
              className="text-xs font-semibold text-gray-500 hover:text-[#1857b8]"
            >
              مسح الفلاتر
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
