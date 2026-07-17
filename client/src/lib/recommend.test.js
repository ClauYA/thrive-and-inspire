import { describe, it, expect } from "vitest";
import { recommendation, toneStyles } from "./recommend.js";

describe("recommendation", () => {
  it("returns 'first' when there are no sets", () => {
    expect(recommendation([]).tone).toBe("first");
    expect(recommendation(null).tone).toBe("first");
  });

  it("returns 'maintain' (asking for RIR) when RIR is missing", () => {
    expect(recommendation([{ weight: 50, reps: 10, rir: "" }]).tone).toBe("maintain");
  });

  it("suggests increase at RIR >= 3 with the right increment", () => {
    const heavy = recommendation([{ weight: 40, reps: 8, rir: "3" }]);
    expect(heavy.tone).toBe("increase");
    expect(heavy.text).toContain("+2.5"); // weight >= 20

    const light = recommendation([{ weight: 10, reps: 12, rir: "3-4" }]);
    expect(light.tone).toBe("increase");
    expect(light.text).toContain("+1"); // 0 < weight < 20

    const bodyweight = recommendation([{ weight: 0, reps: 15, rir: "4" }]);
    expect(bodyweight.tone).toBe("increase");
    expect(bodyweight.text).not.toContain("(+"); // no numeric increment for bodyweight
  });

  it("pushes for more reps at RIR 2", () => {
    expect(recommendation([{ weight: 60, reps: 8, rir: "2" }]).tone).toBe("push");
  });

  it("maintains near failure (RIR 0/1 or 'fallo')", () => {
    expect(recommendation([{ weight: 60, reps: 8, rir: "1" }]).tone).toBe("maintain");
    expect(recommendation([{ weight: 60, reps: 8, rir: "fallo" }]).tone).toBe("maintain");
  });

  it("picks the top set by weight, tie-broken by reps", () => {
    const r = recommendation([
      { weight: 50, reps: 5, rir: "3" },
      { weight: 60, reps: 6, rir: "2" }, // heaviest → RIR 2 → push
    ]);
    expect(r.tone).toBe("push");
  });

  it("localizes text for es vs en", () => {
    const sets = [{ weight: 40, reps: 8, rir: "3" }];
    expect(recommendation(sets, "es").text).not.toBe(recommendation(sets, "en").text);
  });

  it("has a style for every tone", () => {
    for (const tone of ["first", "increase", "push", "maintain"]) {
      expect(toneStyles[tone]).toBeTruthy();
    }
  });
});
