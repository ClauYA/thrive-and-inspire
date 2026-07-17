import { describe, it, expect } from "vitest";
import { formatDate } from "./format.js";

describe("formatDate", () => {
  it("returns empty string for missing input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate(null)).toBe("");
  });

  it("formats a valid ISO date in English", () => {
    const s = formatDate("2026-07-03", "en");
    expect(s).toContain("2026");
    expect(s).toContain("July");
  });

  it("differs between es and en", () => {
    expect(formatDate("2026-07-03", "es")).not.toBe(formatDate("2026-07-03", "en"));
  });

  it("does not throw on an invalid date", () => {
    expect(() => formatDate("not-a-date")).not.toThrow();
  });
});
