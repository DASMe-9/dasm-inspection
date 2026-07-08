import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicReportByToken,
  type PublicReportItem,
} from "@/lib/data/inspection";
import type { ReportItemStatus } from "@/types";

// Public report pages must never be indexed by search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const STATUS: Record<
  ReportItemStatus,
  { label: string; cls: string }
> = {
  pass: { label: "سليم", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50" },
  warn: { label: "تحذير", cls: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50" },
  fail: { label: "عطل", cls: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50" },
  na: { label: "لا ينطبق", cls: "bg-gray-100 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700" },
};

const TRACK_LABEL: Record<string, string> = {
  haraj_live: "حراج مباشر",
  instant: "بيع فوري",
  delayed: "بيع مؤجّل",
  fixed: "سعر ثابت",
  rejected: "غير مؤهّل للمزاد",
};

const LETTER_CLS: Record<string, string> = {
  A: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900/50",
  B: "text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/40 dark:border-teal-900/50",
  C: "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/50",
  D: "text-orange-800 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/40 dark:border-orange-900/50",
  F: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/40 dark:border-red-900/50",
};

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function groupBySection(items: PublicReportItem[]): [string, PublicReportItem[]][] {
  const order: string[] = [];
  const map = new Map<string, PublicReportItem[]>();
  for (const it of items) {
    if (!map.has(it.section)) {
      map.set(it.section, []);
      order.push(it.section);
    }
    map.get(it.section)!.push(it);
  }
  return order.map((s) => [s, map.get(s)!]);
}

export default async function PublicReportPage({
  params,
}: {
  params: { token: string };
}) {
  const report = await getPublicReportByToken(params.token);
  if (!report) notFound();

  const sections = groupBySection(report.items);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
    >
      <header className="bg-[#26215C] text-[#EEEDFE]">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <p className="text-xs font-medium text-[#AFA9EC]">فحص داسم — تقرير معتمد</p>
          <h1 className="mt-1 text-xl font-medium">{report.workshopName ?? "ورشة معتمدة"}</h1>
          <p className="mt-1 text-sm text-[#AFA9EC]">اعتُمد في {fmtDate(report.approvedAt)}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {typeof report.finalScore === "number" && (
          <section className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div
              className={`flex items-baseline gap-1.5 rounded-xl border px-4 py-2 ${
                LETTER_CLS[report.letterGrade ?? ""] ||
                "text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <span className="text-3xl font-medium tabular-nums leading-none">
                {report.finalScore.toFixed(1)}
              </span>
              <span className="text-xs opacity-70">/ 100</span>
              {report.letterGrade && (
                <span className="ms-1.5 text-xl font-medium leading-none">{report.letterGrade}</span>
              )}
            </div>
            {report.harajTrack && TRACK_LABEL[report.harajTrack] && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800 ring-1 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-900/50">
                مسار البيع: {TRACK_LABEL[report.harajTrack]}
              </span>
            )}
            <span className="text-[11px] text-gray-500 dark:text-gray-400">درجة موزونة حسب معيار داسم</span>
          </section>
        )}

        {report.overallSummary && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            {report.overallSummary}
          </section>
        )}

        {sections.map(([section, items]) => (
          <section
            key={section}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200">
              {section}
            </h2>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{it.label}</p>
                    {it.notes && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{it.notes}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS[it.status].cls}`}
                  >
                    {STATUS[it.status].label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          منصة داسم للفحص — هذا التقرير معتمد ومشارَك عبر رابط خاص. لا يُفهرَس.
        </footer>
      </div>
    </main>
  );
}
