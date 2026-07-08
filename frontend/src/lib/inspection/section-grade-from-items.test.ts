/**
 * Tests for the checklist-items → 8-section scoring bridge.
 * Runner: Vitest. Run: npm run test -- lib/inspection/section-grade-from-items.test.ts
 */

import { describe, it, expect } from "vitest";
import { DEFAULT_REPORT_ITEMS } from "@/lib/checklist/default-report-items";
import { SECTION_WEIGHTS, type SectionKey } from "@/lib/inspection/scoring";
import {
  classifyItemToSection,
  deriveSectionCondition,
  buildWorkshopLayerFromItems,
  computeGradeFromReportItems,
} from "@/lib/inspection/section-grade-from-items";

const EXCLUDED = new Set([
  "بيانات ومطابقة المركبة",
  "خدمات موصى بها",
  "ملاحظات عامة",
]);
const VALID_SECTIONS = new Set(Object.keys(SECTION_WEIGHTS));

describe("classification coverage of the full 121-item seed", () => {
  it("every non-excluded seed item maps to a valid scoring section (no silent unmatched)", () => {
    const unmatched = DEFAULT_REPORT_ITEMS.filter(
      (it) =>
        !EXCLUDED.has(it.section) &&
        classifyItemToSection(it.section, it.label) === null
    );
    expect(unmatched.map((u) => `${u.section} / ${u.label}`)).toEqual([]);
  });

  it("every excluded-section item classifies as null", () => {
    const leaked = DEFAULT_REPORT_ITEMS.filter(
      (it) =>
        EXCLUDED.has(it.section) &&
        classifyItemToSection(it.section, it.label) !== null
    );
    expect(leaked).toEqual([]);
  });

  it("all 8 weighted sections receive at least one seed item", () => {
    const covered = new Set<SectionKey>();
    for (const it of DEFAULT_REPORT_ITEMS) {
      const k = classifyItemToSection(it.section, it.label);
      if (k) covered.add(k);
    }
    expect([...VALID_SECTIONS].filter((s) => !covered.has(s as SectionKey))).toEqual([]);
  });
});

describe("signed-off ambiguous-item rulings", () => {
  const cases: Array<[string, string, SectionKey]> = [
    ["الفحص الخارجي والسلامة", "الزجاج الأمامي والخلفي والجانبي", "interior"],
    ["سوائل وأنظمة المحرك", "أداء البطارية وأطرافها", "electrical"],
    ["سوائل وأنظمة المحرك", "أداء الكلتش إن وجد", "transmission"],
    ["الإطارات والعجلات", "انحراف العجلات / Side slip", "road_test"],
    ["الانبعاثات", "غازات العادم", "engine"],
    ["الفحص الخارجي والسلامة", "تلف أو صدمات في جسم السيارة", "body_paint"],
  ];
  it.each(cases)("%s / %s → %s", (section, label, expected) => {
    expect(classifyItemToSection(section, label)).toBe(expected);
  });
});

describe("deriveSectionCondition thresholds", () => {
  const mk = (pass: number, warn: number, fail: number, na = 0) => [
    ...Array(pass).fill({ status: "pass" as const }),
    ...Array(warn).fill({ status: "warn" as const }),
    ...Array(fail).fill({ status: "fail" as const }),
    ...Array(na).fill({ status: "na" as const }),
  ];

  it("all pass → excellent", () => expect(deriveSectionCondition(mk(10, 0, 0))).toBe("excellent"));
  it("fail=0, warn/N ≤ 0.20 → good", () => expect(deriveSectionCondition(mk(9, 1, 0))).toBe("good"));
  it("fail=0, warn/N > 0.20 → fair", () => expect(deriveSectionCondition(mk(6, 4, 0))).toBe("fair"));
  it("fail/N ≤ 0.10 → fair", () => expect(deriveSectionCondition(mk(9, 0, 1))).toBe("fair"));
  it("0.10 < fail/N ≤ 0.30 → poor", () => expect(deriveSectionCondition(mk(7, 0, 3))).toBe("poor"));
  it("fail/N > 0.30 → critical", () => expect(deriveSectionCondition(mk(5, 0, 5))).toBe("critical"));
  it("only na → not_tested (excluded from denominator)", () =>
    expect(deriveSectionCondition(mk(0, 0, 0, 4))).toBe("not_tested"));
  it("na does not dilute the ratio", () =>
    expect(deriveSectionCondition(mk(9, 1, 0, 20))).toBe("good"));
});

describe("end-to-end grade from items", () => {
  it("an all-pass report scores A / haraj_live", () => {
    const items = DEFAULT_REPORT_ITEMS.map((it) => ({
      section: it.section,
      label: it.label,
      status: "pass" as const,
    }));
    const g = computeGradeFromReportItems(items);
    expect(g.finalScore).toBe(100);
    expect(g.letterGrade).toBe("A");
    expect(g.auctionTrack).toBe("haraj_live");
  });

  it("a section with no items is dropped, weights renormalize", () => {
    // Only body_paint scoreable (all pass) → finalScore 100 over active weight.
    const layer = buildWorkshopLayerFromItems([
      { section: "الفحص الخارجي والسلامة", label: "تلف أو صدمات في جسم السيارة", status: "pass" },
    ]);
    expect(layer.body_paint?.overall_status).toBe("excellent");
    expect(Object.keys(layer)).toEqual(["body_paint"]);
  });
});
