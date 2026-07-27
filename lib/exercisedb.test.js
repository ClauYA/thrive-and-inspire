import { describe, it, expect } from "vitest";
import { edbTokens, edbQueries, bestByOverlap } from "./exercisedb.js";

describe("edbTokens", () => {
  it("lowercases, strips parentheticals and punctuation", () => {
    expect(edbTokens("Barbell Hip Thrust (Slow Eccentric)")).toEqual(["barbell", "hip", "thrust"]);
    expect(edbTokens("Single-Leg Leg Extension")).toEqual(["single", "leg", "leg", "extension"]);
  });
});

describe("edbQueries", () => {
  it("goes broad → narrow, dropping equipment words, de-duped", () => {
    expect(edbQueries("Barbell Hip Thrust")).toEqual(["barbell hip thrust", "hip thrust", "thrust"]);
  });
  it("handles a plain movement name", () => {
    expect(edbQueries("Crunch")).toEqual(["crunch"]);
  });
});

describe("bestByOverlap", () => {
  it("picks the candidate sharing the most words with the target", () => {
    const cands = [
      { id: "1", name: "cable seated row" },
      { id: "2", name: "barbell incline bench press" },
      { id: "3", name: "dumbbell incline bench press" },
    ];
    // "Incline Dumbbell Press" shares 3 words with candidate 3.
    expect(bestByOverlap("Incline Dumbbell Press", cands).id).toBe("3");
  });
  it("falls back to the first candidate when nothing overlaps", () => {
    expect(bestByOverlap("zzz", [{ id: "9", name: "cable row" }]).id).toBe("9");
  });
  it("returns null for no candidates", () => {
    expect(bestByOverlap("squat", [])).toBe(null);
  });
});
