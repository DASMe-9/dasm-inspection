import { describe, it, expect } from "vitest";
import { SECTION_WEIGHTS, type SectionKey } from "@/lib/inspection/scoring";
import {
  CHECKLIST_TEMPLATE,
  templateForTier,
  templateByWeightedSection,
} from "@/lib/checklist/checklist-template";

describe("signed-off checklist template", () => {
  it("has contiguous sort order and no gaps", () => {
    CHECKLIST_TEMPLATE.forEach((item, i) => expect(item.sortOrder).toBe(i));
  });

  it("covers all 8 weighted sections with scoreable items", () => {
    const grouped = templateByWeightedSection();
    const missing = (Object.keys(SECTION_WEIGHTS) as SectionKey[]).filter(
      (s) => !(grouped[s] && grouped[s].length > 0)
    );
    expect(missing).toEqual([]);
  });

  it("includes the signed-off gap items", () => {
    const labels = CHECKLIST_TEMPLATE.map((i) => i.label);
    for (const gap of [
      "قياس سماكة دهان الأبواب (يمين/يسار)",
      "نسبة تظليل الزجاج (نظامي)",
      "مسح أكواد الأعطال OBD-II",
      "لمبة فحص المحرك (MIL)",
      "صحة بطارية الجهد العالي SOH%",
      "تاريخ صنع الإطارات (DOT)",
      "حرارة مخرج المكيّف (المحيط + المخرج)",
    ]) {
      expect(labels).toContain(gap);
    }
  });

  it("warning-light items are binary; paint/tread/DOT are numeric", () => {
    const byLabel = (l: string) => CHECKLIST_TEMPLATE.find((i) => i.label === l)!;
    expect(byLabel("لمبة تحذير ABS").inputType).toBe("binary");
    expect(byLabel("قياس سماكة دهان الكبوت والصندوق").inputType).toBe("numeric");
    expect(byLabel("تاريخ صنع الإطارات (DOT)").inputType).toBe("numeric");
    expect(byLabel("مسح أكواد الأعطال OBD-II").inputType).toBe("pass_warn_fail");
  });

  it("essential tier is a non-empty subset of comprehensive (body/engine/transmission + OBD)", () => {
    const all = templateForTier("comprehensive");
    const essential = templateForTier("essential");
    expect(essential.length).toBeGreaterThan(0);
    expect(essential.length).toBeLessThan(all.length);
    // every essential item is body_paint / engine / transmission, or the OBD scan
    for (const item of essential) {
      const ok =
        item.weightedSection === "body_paint" ||
        item.weightedSection === "engine" ||
        item.weightedSection === "transmission" ||
        item.label.includes("OBD-II");
      expect(ok).toBe(true);
    }
  });

  it("excluded (non-scored) items carry a null weighted section", () => {
    const excluded = CHECKLIST_TEMPLATE.filter((i) => i.weightedSection === null);
    // identity / recommended-services / notes exist and are excluded from scoring
    expect(excluded.length).toBeGreaterThan(0);
  });

  it("photo-on-fail flags the evidence-critical items", () => {
    const byLabel = (l: string) => CHECKLIST_TEMPLATE.find((i) => i.label === l)!;
    expect(byLabel("تلف أو صدمات في جسم السيارة").photoRequiredOnFail).toBe(true);
    expect(byLabel("أحزمة الأمان والمقاعد").photoRequiredOnFail).toBe(true);
  });
});
