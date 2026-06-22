import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_ITEMS } from "@/lib/checklist/default-report-items";

describe("DEFAULT_REPORT_ITEMS", () => {
  it("keeps sort order unique and sequential", () => {
    const orders = DEFAULT_REPORT_ITEMS.map((item) => item.sort_order);
    expect(new Set(orders).size).toBe(DEFAULT_REPORT_ITEMS.length);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(orders[0]).toBe(0);
    expect(orders.at(-1)).toBe(DEFAULT_REPORT_ITEMS.length - 1);
  });

  it("covers periodic inspection and workshop VHC fields", () => {
    const labels = DEFAULT_REPORT_ITEMS.map((item) => item.label).join("\n");

    expect(labels).toContain("رقم الهيكل / الشاصي");
    expect(labels).toContain("الأنوار الأمامية");
    expect(labels).toContain("الوصلات الكروية لأذرعة التوجيه");
    expect(labels).toContain("اختبار الفرامل");
    expect(labels).toContain("مستوى وحالة سائل ناقل الحركة الأوتوماتيكي");
    expect(labels).toContain("أداء البطارية وأطرافها");
    expect(labels).toContain("سماكة الفرامل الأمامية يمين/يسار");
    expect(labels).toContain("عمق مداس الإطار الأمامي الأيسر LF");
    expect(labels).toContain("ضبط زوايا الإطارات / Wheel alignment");
  });
});
