"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveFieldScheduleFormAction } from "@/app/actions/workshop-field";
import { RequestStatusBadge } from "@/components/inspection/RequestStatusBadge";
import { SectionCard } from "@/components/shared";
import {
  calendarDayRange,
  fieldJobCalendarDate,
  groupFieldJobsByDay,
} from "@/lib/field-schedule";
import type { InspectionRequest } from "@/types";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00`);
  return d.toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function WorkshopFieldCalendarPanel({
  workshopId,
  requests,
}: {
  workshopId: string;
  requests: InspectionRequest[];
}) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const days = useMemo(
    () => calendarDayRange(weekStart, 7),
    [weekStart]
  );
  const byDay = useMemo(() => groupFieldJobsByDay(requests), [requests]);

  function shiftWeek(delta: number) {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  }

  return (
    <SectionCard title="تقويم الزيارات الميدانية">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-600" aria-hidden />
          عرض أسبوع — يمكن ضبط موعد الزيارة وإحداثيات اختيارية لكل طلب.
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label="الأسبوع السابق"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label="الأسبوع التالي"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {days.map((dayKey) => {
          const jobs = byDay.get(dayKey) ?? [];
          return (
            <div
              key={dayKey}
              className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatDayLabel(dayKey)}
              </p>
              {jobs.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">لا زيارات ميدانية.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {jobs.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/requests/${r.id}`}
                            className="text-sm font-semibold text-[#1857b8] hover:underline"
                          >
                            {r.vehicleLabel}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {r.fieldServiceAddress}
                          </p>
                        </div>
                        <RequestStatusBadge status={r.status} />
                      </div>
                      <form
                        action={saveFieldScheduleFormAction}
                        className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                      >
                        <input
                          type="hidden"
                          name="workshop_id"
                          value={workshopId}
                        />
                        <input type="hidden" name="request_id" value={r.id} />
                        <label className="block text-xs text-slate-600 dark:text-slate-400 sm:col-span-2">
                          موعد الزيارة
                          <input
                            type="datetime-local"
                            name="field_scheduled_at"
                            defaultValue={toDatetimeLocalValue(
                              r.fieldScheduledAt ??
                                r.dispatchedAt ??
                                (fieldJobCalendarDate(r) === dayKey
                                  ? r.createdAt
                                  : undefined)
                            )}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </label>
                        <label className="block text-xs text-slate-600 dark:text-slate-400">
                          خط العرض
                          <input
                            type="text"
                            name="field_service_lat"
                            inputMode="decimal"
                            placeholder="24.7136"
                            defaultValue={
                              r.fieldServiceLat != null
                                ? String(r.fieldServiceLat)
                                : ""
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </label>
                        <label className="block text-xs text-slate-600 dark:text-slate-400">
                          خط الطول
                          <input
                            type="text"
                            name="field_service_lng"
                            inputMode="decimal"
                            placeholder="46.6753"
                            defaultValue={
                              r.fieldServiceLng != null
                                ? String(r.fieldServiceLng)
                                : ""
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </label>
                        <div className="flex items-end sm:col-span-2 lg:col-span-4">
                          <button
                            type="submit"
                            className="rounded-lg bg-[#1E74E8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1857b8]"
                          >
                            حفظ الموعد
                          </button>
                        </div>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
