import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchExerciseGif } from "./gif.js";

afterEach(() => vi.unstubAllGlobals());

describe("fetchExerciseGif", () => {
  it("returns null (and makes no request) without a name", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchExerciseGif("")).toBe(null);
    expect(f).not.toHaveBeenCalled();
  });

  it("returns the gif url from the server proxy", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, gif: "https://x/g.gif" }) })));
    expect(await fetchExerciseGif("Squat")).toBe("https://x/g.gif");
  });

  it("returns null when the server has no gif", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, gif: null }) })));
    expect(await fetchExerciseGif("Squat")).toBe(null);
  });

  it("returns null on a failed request", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })));
    expect(await fetchExerciseGif("Squat")).toBe(null);
  });
});
