import { describe, it, expect } from "vitest";
import { clampSets } from "./plan.js";

describe("clampSets", () => {
  it("returns null for empty / non-numeric / non-positive input", () => {
    expect(clampSets(null)).toBe(null);
    expect(clampSets(undefined)).toBe(null);
    expect(clampSets("")).toBe(null);
    expect(clampSets("abc")).toBe(null);
    expect(clampSets(0)).toBe(null);
    expect(clampSets(-3)).toBe(null);
    expect(clampSets(0.4)).toBe(null); // rounds to 0
  });

  it("keeps whole values within 1–20 inclusive", () => {
    expect(clampSets(1)).toBe(1);
    expect(clampSets(20)).toBe(20);
    expect(clampSets("5")).toBe(5);
  });

  it("clamps values above 20 down to 20 (the '323' corruption bug)", () => {
    expect(clampSets(21)).toBe(20);
    expect(clampSets(100)).toBe(20);
    expect(clampSets("323")).toBe(20);
  });

  it("rounds to the nearest whole number", () => {
    expect(clampSets(3.4)).toBe(3);
    expect(clampSets(3.6)).toBe(4);
  });
});
