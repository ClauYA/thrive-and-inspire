import { describe, it, expect } from "vitest";
import { lbToKg, kgToLb, roundTenth, LB_PER_KG } from "./units.js";

describe("units", () => {
  it("converts pounds to kilograms", () => {
    expect(lbToKg(100)).toBeCloseTo(45.359237, 6);
    expect(lbToKg(0)).toBe(0);
  });

  it("round-trips kg <-> lb", () => {
    for (const x of [1, 42.5, 100, 225]) {
      expect(kgToLb(lbToKg(x))).toBeCloseTo(x, 9);
    }
  });

  it("rounds to a tenth", () => {
    expect(roundTenth(45.3592)).toBe(45.4);
    expect(roundTenth(72)).toBe(72);
  });

  it("exposes the canonical constant", () => {
    expect(LB_PER_KG).toBe(0.45359237);
  });
});
