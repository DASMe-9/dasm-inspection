/**
 * DASM-e — Section grade builder (checklist items → 8 weighted scoring sections)
 *
 * Bridges the live report model (121 checklist items, each pass/warn/fail/na,
 * grouped into 11 Arabic inspection-zone sections) onto the valuation model
 * that `scoring.ts` consumes (8 weighted sections, each with one condition
 * grade excellent→critical).
 *
 * The mapping and thresholds below are the owner-signed-off model (2026-07-08,
 * decision-table sign-off). Do NOT change allocations without a new sign-off.
 *
 * Pure functions, no side effects — feed the output to computeFinalGrade().
 */

import type { ReportItemStatus } from "@/types";
import {
  computeFinalGrade,
  type ComputedGrade,
  type ConditionGrade,
  type MinimalWorkshopLayer,
  type SectionKey,
} from "@/lib/inspection/scoring";

/** One checklist item as stored on inspection_report_items. */
export interface ReportItemLike {
  section: string;
  label: string;
  status: ReportItemStatus;
}

/** Live sections excluded from scoring (identity / recommendations / notes). */
const EXCLUDED_SECTIONS: ReadonlySet<string> = new Set([
  "بيانات ومطابقة المركبة",
  "خدمات موصى بها",
  "ملاحظات عامة",
]);

/** Clean live-section → scoring-section defaults (no per-item split needed). */
const SECTION_DEFAULT: Readonly<Record<string, SectionKey>> = {
  "الفرامل والقياسات": "road_test",
  "الإطارات والعجلات": "suspension_tires",
  "الرؤية والداخلية": "interior",
  "الانبعاثات": "engine", // emissions merged into engine per sign-off
};

/**
 * Per-item overrides for live sections that span several scoring sections.
 * Keyed by the exact label from default-report-items.ts (the canonical seed).
 * Anything here wins over SECTION_DEFAULT.
 */
const LABEL_TO_SECTION: Readonly<Record<string, SectionKey>> = {
  // ── الفحص الخارجي والسلامة (spans body_paint / electrical / road_test / interior / engine / tires)
  "نقاط وقواعد تثبيت جسم السيارة": "body_paint",
  "الأسطوانة الرئيسية للفرامل": "road_test",
  "سلامة التوصيلات الكهربائية الرئيسية": "electrical",
  "الأنوار الأمامية": "electrical",
  "الأنوار الأمامية الإضافية": "electrical",
  "أنوار الوقوف": "electrical",
  "أنوار الإشارة الأمامية والجانبية": "electrical",
  "أنوار التحذير / الفلشر": "electrical",
  "البوري / الزامور": "electrical",
  "الزجاج الأمامي والخلفي والجانبي": "interior", // glass → interior per sign-off
  "المساحات": "interior",
  "رشاش غسيل الزجاج الأمامي": "interior",
  "مرايا الرؤية الجانبية والخلفية": "interior",
  "العواكس الخلفية": "electrical",
  "الأبواب والمفصلات والغطاء / الكبوت": "body_paint",
  "الإطارات الخارجية": "suspension_tires",
  "مسامير وصواميل وأطواق الإطارات / الجنوط": "suspension_tires",
  "أنوار معدات التحكم / العاكس المطلوب": "electrical",
  "سيور المحرك الظاهرة": "engine",
  "الأنوار الخلفية": "electrical",
  "أنوار الرجوع للخلف وأنوار اللوحة": "electrical",
  "أنوار الإشارة الخلفية والجانبية": "electrical",
  "أنوار الفرامل": "electrical",
  "كثافة دخان المحرك": "engine",
  "عجلة القيادة وعمودها": "interior",
  "مقود الدراجات النارية إن وجد": "interior",
  "أحزمة الأمان والمقاعد": "interior",
  "دواسة الفرامل / فرامل الدراجة النارية": "road_test",
  "فرامل اليد / فرامل الوقوف": "road_test",
  "حواجز الشاحنات والمقطورات": "body_paint",
  "تلف أو صدمات في جسم السيارة": "body_paint",
  "طفاية الحريق ومثلث التحذير": "interior",
  "خزان الوقود": "engine",
  "خزانات الهواء": "engine",
  "ميكانيكية وصل المقطورات بالشاحنات": "body_paint",
  "تآكل أو صدأ خارجي": "body_paint",
  "غاز العادم للديزل": "engine",

  // ── الأجزاء السفلية والتوجيه (spans road_test / suspension / engine / transmission / body_paint)
  "الوصلات الكروية لأذرعة التوجيه": "road_test",
  "تثبيت علبة دركسون / علبة التوجيه": "road_test",
  "أجزاء التوجيه الهيدروليكي": "road_test",
  "أذرع وروابط دائرة التوجيه": "road_test",
  "خراطيم وأنابيب ووصلات الفرامل": "road_test",
  "أقراص / هوبات / أقمشة / لقمات الفرامل": "road_test",
  "أسطوانات دائرة الفرامل": "road_test",
  "أجزاء دائرة الفرامل الهوائية": "road_test",
  "عمود التوازن والجلد": "suspension_tires",
  "دائرة التعليق للمحور الأمامي": "suspension_tires",
  "دائرة التعليق للمحور الخلفي": "suspension_tires",
  "الزنبركات الأمامية": "suspension_tires",
  "الزنبركات الخلفية": "suspension_tires",
  "الإطارات والجنوط من الأسفل": "suspension_tires",
  "ممتصات الاهتزاز / المساعدات": "suspension_tires",
  "كراسي الماكينة / تثبيت المحرك": "engine",
  "كراسي صندوق التروس / القير": "transmission",
  "أجزاء نقل الحركة": "transmission",
  "أنبوب العادم / كاتم الصوت / الحفاز": "engine",
  "خزان الوقود من الأسفل": "engine",
  "تسريب في دائرة الوقود": "engine",
  "هيكل الشاصي والجسور والقواطع": "body_paint",
  "حالة إصلاح هيكل الشاصي": "body_paint",
  "تآكل أو صدأ في الأجزاء السفلية": "body_paint",
  "تسريب زيت ثانوي": "engine",
  "تسريب زيت رئيسي": "engine",

  // ── سوائل وأنظمة المحرك (spans engine / transmission / electrical / ac_cooling / road_test / interior)
  "مستوى وحالة سائل ناقل الحركة الأوتوماتيكي": "transmission",
  "مستوى وحالة زيت الفرامل": "road_test",
  "مستوى وحالة سائل التبريد في القربة": "ac_cooling",
  "مستوى وحالة سائل عجلة القيادة": "road_test",
  "مستوى وحالة زيت المحرك": "engine",
  "مستوى سائل غسيل الزجاج الأمامي": "interior",
  "أداء البطارية وأطرافها": "electrical",
  "أداء الكلتش إن وجد": "transmission",
  "جلد عكوس / محامل محور القيادة CV إن وجدت": "transmission",
  "نظام وخراطيم التبريد - تسريب أو تلف ظاهر": "ac_cooling",
  "سيور المحرك": "engine",
  "نظام العادم - أجزاء سائبة أو تلف أو تسريب": "engine",
  "تسريب زيت أو سوائل أخرى": "engine",

  // ── التوجيه والتعليق (2 items split)
  "عجلة التوجيه والوصلات وأطراف العجلات وخلوص المحور": "road_test",
  "التعليق - ضرر أو تسريب أو ضغط / ارتداد المساعدات": "suspension_tires",

  // ── الإطارات والعجلات override (section default = suspension_tires)
  "انحراف العجلات / Side slip": "road_test",
};

/**
 * Classify one checklist item to a scoring section, or null if excluded.
 * Order: excluded section → exact-label override → live-section default → null.
 */
export function classifyItemToSection(
  section: string,
  label: string
): SectionKey | null {
  if (EXCLUDED_SECTIONS.has(section)) return null;
  const override = LABEL_TO_SECTION[label];
  if (override) return override;
  const fallback = SECTION_DEFAULT[section];
  return fallback ?? null;
}

// ── Section condition derivation (owner-approved thresholds, 2026-07-08) ──────
// N = pass + warn + fail (na excluded). N === 0 → not_tested (dropped from the
// weighted average). Any fail caps the section at 'fair' or below.
// Calibration note: revisit thresholds after the first 20–30 real inspections.

const WARN_GOOD_MAX = 0.2; // fail=0 & warn/N ≤ 0.20 → good
const FAIL_FAIR_MAX = 0.1; // fail/N ≤ 0.10 → fair
const FAIL_POOR_MAX = 0.3; // 0.10 < fail/N ≤ 0.30 → poor; above → critical

export function deriveSectionCondition(
  items: ReadonlyArray<{ status: ReportItemStatus }>
): ConditionGrade {
  let pass = 0;
  let warn = 0;
  let fail = 0;
  for (const it of items) {
    if (it.status === "pass") pass++;
    else if (it.status === "warn") warn++;
    else if (it.status === "fail") fail++;
    // "na" excluded from the denominator
  }
  const n = pass + warn + fail;
  if (n === 0) return "not_tested";

  const failRatio = fail / n;
  const warnRatio = warn / n;

  if (fail === 0 && warn === 0) return "excellent";
  if (fail === 0 && warnRatio <= WARN_GOOD_MAX) return "good";
  if (failRatio <= FAIL_FAIR_MAX) return "fair"; // covers fail=0 & warn/N>0.20 too
  if (failRatio <= FAIL_POOR_MAX) return "poor";
  return "critical";
}

/**
 * Group items into the 8 scoring sections and derive each section's condition.
 * Sections with no scoreable items are left undefined → treated as not_tested
 * by scoring.ts and dropped from the weighted average.
 */
export function buildWorkshopLayerFromItems(
  items: ReadonlyArray<ReportItemLike>
): MinimalWorkshopLayer {
  const buckets = new Map<SectionKey, { status: ReportItemStatus }[]>();
  for (const it of items) {
    const key = classifyItemToSection(it.section, it.label);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push({ status: it.status });
    buckets.set(key, list);
  }

  const layer: MinimalWorkshopLayer = {};
  for (const [key, list] of buckets) {
    layer[key] = { overall_status: deriveSectionCondition(list) };
  }
  return layer;
}

/**
 * End-to-end: checklist items → weighted final score, letter grade, and
 * auction track. Thin wrapper composing the builder with scoring.ts.
 */
export function computeGradeFromReportItems(
  items: ReadonlyArray<ReportItemLike>
): ComputedGrade {
  return computeFinalGrade(buildWorkshopLayerFromItems(items));
}
