import { describe, it, expect } from "vitest";
import { fetchExerciseGif } from "./gif.js";

describe("fetchExerciseGif", () => {
  it("returns null without an API key (no network call)", async () => {
    expect(await fetchExerciseGif("Squat", undefined)).toBe(null);
    expect(await fetchExerciseGif("Squat", "")).toBe(null);
  });

  it("returns null without a name", async () => {
    expect(await fetchExerciseGif("", "somekey")).toBe(null);
  });
});
