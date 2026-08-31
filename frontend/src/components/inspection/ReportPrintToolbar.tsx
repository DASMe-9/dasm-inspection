"use client";

import { Download, Printer } from "lucide-react";

export function ReportPrintToolbar({
  publicReportHref,
  pdfHref,
}: {
  /** رابط التقرير العام للمشاركة مع العميل (اختياري). */
  publicReportHref?: string | null;
  /** رابط تنزيل التقرير كملف PDF حقيقي (اختياري). */
  pdfHref?: string | null;
}) {
  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16304f] print:hidden"
      >
        <Printer size={16} aria-hidden />
        طباعة
      </button>
      {pdfHref ? (
        <a
          href={pdfHref}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 print:hidden"
        >
          <Download size={16} aria-hidden />
          تنزيل PDF
        </a>
      ) : null}
      {publicReportHref ? (
        <a
          href={publicReportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 print:hidden"
        >
          رابط التقرير للعميل
        </a>
      ) : null}
    </div>
  );
}
