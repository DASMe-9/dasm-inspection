import { describe, expect, it } from "vitest";
import {
  canEditRepairQuote,
  parseRepairQuoteSar,
  normalizeRepairQuoteNotes,
} from "./repair-quote";

describe("repair-quote", () => {
  it("allows edit only during active inspection lifecycle", () => {
    expect(canEditRepairQuote("in_progress")).toBe(true);
    expect(canEditRepairQuote("pending_review")).toBe(true);
    expect(canEditRepairQuote("approved")).toBe(true);
    expect(canEditRepairQuote("submitted")).toBe(false);
    expect(canEditRepairQuote("assigned")).toBe(false);
  });

  it("parses and bounds repair quote amount", () => {
    expect(parseRepairQuoteSar("350.5")).toBe(350.5);
    expect(parseRepairQuoteSar(null)).toBeNull();
    expect(parseRepairQuoteSar(-1)).toBeNull();
    expect(parseRepairQuoteSar(10_000_000)).toBeNull();
  });

  it("trims repair quote notes", () => {
    expect(normalizeRepairQuoteNotes("  ملاحظة  ")).toBe("ملاحظة");
    expect(normalizeRepairQuoteNotes("")).toBeNull();
  });
});
