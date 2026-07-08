/**
 * DASM-e — Phase-2 checklist template (single source of truth).
 *
 * Enriches the base checklist (DEFAULT_REPORT_ITEMS) with the owner-signed-off
 * per-item metadata (2026-07-08): the weighted scoring section, the input type,
 * a photo-on-fail flag, and the package tier. Appends the signed-off gap items
 * (paint-thickness gauge, tint, hybrid battery, OBD-II + warning lights, tire
 * DOT, cabin-AC). This template is what the mobile app renders and what the
 * report seeder writes.
 *
 * Binding reference: docs/features/inspection-phase2-checklist-signed-off.md.
 */
import { DEFAULT_REPORT_ITEMS } from "@/lib/checklist/default-report-items";
import { classifyItemToSection } from "@/lib/inspection/section-grade-from-items";
import type { SectionKey } from "@/lib/inspection/scoring";

export type ChecklistInputType = "pass_warn_fail" | "numeric" | "binary";
export type ChecklistTier = "comprehensive" | "essential";

export type ChecklistTemplateItem = {
  section: string; // Arabic inspection-zone section (UI grouping label)
  label: string;
  sortOrder: number;
  notes?: string;
  /** Weighted scoring section, or null when the item is excluded from scoring. */
  weightedSection: SectionKey | null;
  inputType: ChecklistInputType;
  /** A failed item with this flag is incomplete until a note + photo attach. */
  photoRequiredOnFail: boolean;
  tier: ChecklistTier;
};

// ── Rule helpers (applied to the 121 base items) ─────────────────────────────

const NUMERIC_HINTS = [
  "عمق مداس",
  "سماكة الفرامل",
  "الديسلروميتر",
  "انحراف العجلات",
];

const PHOTO_ON_FAIL_HINTS = [
  "تلف أو صدمات",
  "هيكل الشاصي والجسور",
  "تسريب زيت رئيسي",
  "تسريب في دائرة الوقود",
  "أحزمة الأمان والمقاعد",
  "خدوش أو طعجات",
];

const ESSENTIAL_SECTIONS: ReadonlySet<SectionKey> = new Set<SectionKey>([
  "body_paint",
  "engine",
  "transmission",
]);

function inputTypeFor(label: string): ChecklistInputType {
  return NUMERIC_HINTS.some((h) => label.includes(h)) ? "numeric" : "pass_warn_fail";
}

function photoOnFailFor(label: string): boolean {
  return PHOTO_ON_FAIL_HINTS.some((h) => label.includes(h));
}

function tierFor(weightedSection: SectionKey | null): ChecklistTier {
  return weightedSection !== null && ESSENTIAL_SECTIONS.has(weightedSection)
    ? "essential"
    : "comprehensive";
}

// ── Signed-off gap items (explicit metadata) ─────────────────────────────────

type GapSeed = Omit<ChecklistTemplateItem, "sortOrder">;

const GAP_ITEMS: readonly GapSeed[] = [
  // body_paint — paint-thickness gauge (mandatory equipment) + tint
  { section: "قياسات الدهان", label: "قياس سماكة دهان الأبواب (يمين/يسار)", weightedSection: "body_paint", inputType: "numeric", photoRequiredOnFail: false, tier: "essential" },
  { section: "قياسات الدهان", label: "قياس سماكة دهان الكبوت والصندوق", weightedSection: "body_paint", inputType: "numeric", photoRequiredOnFail: false, tier: "essential" },
  { section: "قياسات الدهان", label: "قياس سماكة دهان الرفارف/الجناحين", weightedSection: "body_paint", inputType: "numeric", photoRequiredOnFail: false, tier: "essential" },
  { section: "قياسات الدهان", label: "نسبة تظليل الزجاج (نظامي)", weightedSection: "body_paint", inputType: "pass_warn_fail", photoRequiredOnFail: false, tier: "essential" },
  // electrical — OBD-II scan (essential) + dashboard warning lights (binary)
  { section: "الفحص الإلكتروني والتشخيص", label: "مسح أكواد الأعطال OBD-II", weightedSection: "electrical", inputType: "pass_warn_fail", photoRequiredOnFail: false, tier: "essential" },
  { section: "الفحص الإلكتروني والتشخيص", label: "لمبة تحذير الوسائد الهوائية (SRS)", weightedSection: "electrical", inputType: "binary", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "الفحص الإلكتروني والتشخيص", label: "لمبة تحذير ABS", weightedSection: "electrical", inputType: "binary", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "الفحص الإلكتروني والتشخيص", label: "لمبة فحص المحرك (MIL)", weightedSection: "electrical", inputType: "binary", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "الفحص الإلكتروني والتشخيص", label: "لمبة تحذير ESP/الثبات", weightedSection: "electrical", inputType: "binary", photoRequiredOnFail: false, tier: "comprehensive" },
  // engine — hybrid / high-voltage (na for ICE at runtime)
  { section: "الهايبرد/الكهربائي", label: "صحة بطارية الجهد العالي SOH%", weightedSection: "engine", inputType: "numeric", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "الهايبرد/الكهربائي", label: "أداء العاكس/الشحن (هايبرد/كهربائي)", weightedSection: "engine", inputType: "pass_warn_fail", photoRequiredOnFail: false, tier: "comprehensive" },
  // suspension_tires — tire DOT age
  { section: "الإطارات والعجلات", label: "تاريخ صنع الإطارات (DOT)", weightedSection: "suspension_tires", inputType: "numeric", photoRequiredOnFail: false, tier: "comprehensive" },
  // ac_cooling — cabin AC (g20 dual-temp numeric, g21-23)
  { section: "التكييف والتبريد", label: "حرارة مخرج المكيّف (المحيط + المخرج)", weightedSection: "ac_cooling", inputType: "numeric", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "التكييف والتبريد", label: "تعشيق الكمبروسر", weightedSection: "ac_cooling", inputType: "pass_warn_fail", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "التكييف والتبريد", label: "تدفّق هواء الكابينة/سرعات المروحة", weightedSection: "ac_cooling", inputType: "pass_warn_fail", photoRequiredOnFail: false, tier: "comprehensive" },
  { section: "التكييف والتبريد", label: "رائحة المكيّف/حالة الفلتر", weightedSection: "ac_cooling", inputType: "pass_warn_fail", photoRequiredOnFail: false, tier: "comprehensive" },
];

/**
 * The full signed-off checklist template: the base items enriched with metadata,
 * followed by the gap items. Ordered; `sortOrder` is contiguous.
 */
export const CHECKLIST_TEMPLATE: readonly ChecklistTemplateItem[] = [
  ...DEFAULT_REPORT_ITEMS.map((it): ChecklistTemplateItem => {
    const weightedSection = classifyItemToSection(it.section, it.label);
    return {
      section: it.section,
      label: it.label,
      sortOrder: it.sort_order,
      notes: it.notes,
      weightedSection,
      inputType: inputTypeFor(it.label),
      photoRequiredOnFail: photoOnFailFor(it.label),
      tier: tierFor(weightedSection),
    };
  }),
  ...GAP_ITEMS.map((g, i): ChecklistTemplateItem => ({
    ...g,
    sortOrder: DEFAULT_REPORT_ITEMS.length + i,
  })),
];

/** Items belonging to a given package tier (essential ⊂ comprehensive). */
export function templateForTier(tier: ChecklistTier): ChecklistTemplateItem[] {
  if (tier === "comprehensive") return [...CHECKLIST_TEMPLATE];
  return CHECKLIST_TEMPLATE.filter((i) => i.tier === "essential");
}

/** Scoreable items grouped by their 8 weighted sections (UI section chips). */
export function templateByWeightedSection(): Record<SectionKey, ChecklistTemplateItem[]> {
  const out = {} as Record<SectionKey, ChecklistTemplateItem[]>;
  for (const item of CHECKLIST_TEMPLATE) {
    const key = item.weightedSection;
    if (key === null) continue;
    const arr = out[key] ?? (out[key] = []);
    arr.push(item);
  }
  return out;
}
