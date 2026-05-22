import { describe, expect, it } from "vitest";
import { escapeCsvCell, rowsToCsv } from "./csv-format";

describe("csv-format", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
  });

  it("builds rows", () => {
    expect(rowsToCsv([["a", "b"], ["1", "2"]])).toBe("a,b\r\n1,2");
  });
});
