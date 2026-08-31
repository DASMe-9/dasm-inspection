import "server-only";

import path from "node:path";
import React from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { PublicReportItem, PublicReportView } from "@/lib/data/inspection";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");
let fontsRegistered = false;

/**
 * Fonts must be registered once per process before the first render — the
 * repo's only Arabic-capable font. Geist (used elsewhere) has no Arabic
 * glyph coverage. A variable-weight build of this font mis-shapes the
 * initial "ت" in a short standalone run (confirmed by rendering + visual
 * check), so this uses the static Regular/Bold instances instead.
 */
function ensureFontsRegistered(): void {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoArabic",
    fonts: [
      { src: path.join(FONT_DIR, "NotoSansArabic.ttf"), fontWeight: "normal" },
      { src: path.join(FONT_DIR, "NotoSansArabic-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  fontsRegistered = true;
}

const STATUS_LABEL: Record<PublicReportItem["status"], string> = {
  pass: "سليم",
  warn: "تحذير",
  fail: "عطل",
  na: "لا ينطبق",
};

const TRACK_LABEL: Record<string, string> = {
  haraj_live: "حراج مباشر",
  instant: "بيع فوري",
  delayed: "بيع مؤجّل",
  fixed: "سعر ثابت",
  rejected: "غير مؤهّل للمزاد",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoArabic",
    direction: "rtl",
    padding: 32,
    fontSize: 11,
    color: "#1a1a1a",
  },
  header: { marginBottom: 16, textAlign: "right" },
  eyebrow: { fontSize: 9, color: "#6b6b6b", marginBottom: 3 },
  title: { fontSize: 18, fontWeight: "bold" },
  meta: { fontSize: 10, color: "#555555", marginTop: 3 },
  scoreRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1 solid #e5e5e5",
  },
  scoreValue: { fontSize: 22, fontWeight: "bold" },
  scoreGrade: { fontSize: 14, fontWeight: "bold" },
  trackBadge: { fontSize: 9, color: "#4a3f7a" },
  summary: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1 solid #e5e5e5",
    textAlign: "right",
    lineHeight: 1.5,
  },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
    padding: 5,
    textAlign: "right",
  },
  item: {
    // Plain "row" (not "row-reverse") — with a right-aligned label first and
    // the status badge second, this reads correctly for RTL. row-reverse
    // combined with justifyContent: "space-between" collapsed both children
    // to the right edge instead of spreading them (verified by rendering
    // both and rasterizing).
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderBottom: "0.5 solid #eeeeee",
  },
  itemLabel: { fontSize: 10, textAlign: "right" },
  itemNotes: { fontSize: 8.5, color: "#777777", marginTop: 2, textAlign: "right" },
  itemStatus: { fontSize: 9, fontWeight: "bold" },
  footer: {
    marginTop: 16,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
  },
});

function groupBySection(
  items: PublicReportItem[],
): [string, PublicReportItem[]][] {
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

function PublicReportDocument({ report }: { report: PublicReportView }) {
  const sections = groupBySection(report.items);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>فحص داسم — تقرير معتمد</Text>
          <Text style={styles.title}>{report.workshopName ?? "ورشة معتمدة"}</Text>
          <Text style={styles.meta}>اعتُمد في {fmtDate(report.approvedAt)}</Text>
        </View>

        {typeof report.finalScore === "number" && (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{report.finalScore.toFixed(1)} / 100</Text>
            {report.letterGrade && (
              <Text style={styles.scoreGrade}>{report.letterGrade}</Text>
            )}
            {report.harajTrack && TRACK_LABEL[report.harajTrack] && (
              <Text style={styles.trackBadge}>
                مسار البيع: {TRACK_LABEL[report.harajTrack]}
              </Text>
            )}
          </View>
        )}

        {report.overallSummary && (
          <Text style={styles.summary}>{report.overallSummary}</Text>
        )}

        {sections.map(([section, items]) => (
          <View style={styles.section} key={section} wrap={false}>
            <Text style={styles.sectionTitle}>{section}</Text>
            {items.map((it) => (
              <View style={styles.item} key={it.id}>
                <View style={{ flexGrow: 1 }}>
                  <Text style={styles.itemLabel}>{it.label}</Text>
                  {it.notes && <Text style={styles.itemNotes}>{it.notes}</Text>}
                </View>
                <Text style={styles.itemStatus}>{STATUS_LABEL[it.status]}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>
          منصة داسم للفحص — هذا التقرير معتمد ومشارَك عبر رابط خاص.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderPublicReportPdf(
  report: PublicReportView,
): Promise<Buffer> {
  ensureFontsRegistered();
  return renderToBuffer(<PublicReportDocument report={report} />);
}
