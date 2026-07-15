/**
 * أصناف Tailwind مشتركة لواجهات الورشة — فاتح/داكن بدون وهج أبيض أو تباين ضعيف.
 */
export const workshopUi = {
  card: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900",
  cardTitle: "mb-4 text-lg font-bold text-slate-900 dark:text-slate-100",
  label: "text-xs font-medium text-slate-600 dark:text-slate-400",
  input:
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E74E8]/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500",
  muted: "text-sm text-slate-600 dark:text-slate-400",
  mutedXs: "text-xs text-slate-500 dark:text-slate-400",
  body: "font-semibold text-slate-900 dark:text-slate-100",
  row: "rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60",
  callout:
    "rounded-2xl border border-sky-200/90 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-100",
  calloutHint: "mt-2 text-xs text-sky-800/90 dark:text-sky-200/80",
  statusOk: "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  statusOff: "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  primaryBtn:
    "rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1857b8] disabled:opacity-60",
} as const;
