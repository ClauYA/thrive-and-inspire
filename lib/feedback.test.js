import { describe, it, expect } from "vitest";
import { parseFeedback } from "./feedback.js";

describe("parseFeedback", () => {
  it("keeps sessionFeel within 1–10 and rounds it", () => {
    expect(parseFeedback({ sessionFeel: 7 }).feel).toBe(7);
    expect(parseFeedback({ sessionFeel: 7.4 }).feel).toBe(7);
    expect(parseFeedback({ sessionFeel: "9" }).feel).toBe(9);
  });

  it("nulls feel when out of range or non-numeric", () => {
    expect(parseFeedback({ sessionFeel: 0 }).feel).toBe(null);
    expect(parseFeedback({ sessionFeel: 11 }).feel).toBe(null);
    expect(parseFeedback({ sessionFeel: "x" }).feel).toBe(null);
    expect(parseFeedback({}).feel).toBe(null);
  });

  it("only accepts whitelisted effort values", () => {
    for (const e of ["easy", "moderate", "hard", "limit"]) {
      expect(parseFeedback({ sessionEffort: e }).effort).toBe(e);
    }
    expect(parseFeedback({ sessionEffort: "extreme" }).effort).toBe("");
    expect(parseFeedback({}).effort).toBe("");
  });

  it("clamps muscleIntensity to 1–5 and returns a JSON string", () => {
    const out = parseFeedback({ muscleIntensity: { Quads: 5, Glutes: 3, Bad: 9, Zero: 0, NaNv: "x" } });
    expect(typeof out.muscleIntensity).toBe("string");
    expect(JSON.parse(out.muscleIntensity)).toEqual({ Quads: 5, Glutes: 3 });
  });

  it("rounds muscleIntensity values and truncates long keys to 40 chars", () => {
    const longKey = "m".repeat(50);
    const parsed = JSON.parse(parseFeedback({ muscleIntensity: { [longKey]: 3.6 } }).muscleIntensity);
    const keys = Object.keys(parsed);
    expect(keys[0].length).toBe(40);
    expect(parsed[keys[0]]).toBe(4);
  });

  it("returns '{}' for missing / non-object muscleIntensity", () => {
    expect(parseFeedback({}).muscleIntensity).toBe("{}");
    expect(parseFeedback({ muscleIntensity: "nope" }).muscleIntensity).toBe("{}");
  });

  it("has the exact { feel, effort, muscleIntensity } shape", () => {
    expect(Object.keys(parseFeedback({})).sort()).toEqual(["effort", "feel", "muscleIntensity"]);
  });
});
