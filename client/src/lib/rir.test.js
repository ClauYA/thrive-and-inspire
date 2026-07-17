import { describe, it, expect } from "vitest";
import { RIR_OPTIONS, rirLabel } from "./rir.js";

describe("rir", () => {
  it("exposes the canonical ladder in order", () => {
    expect(RIR_OPTIONS).toEqual(["fallo", "0", "0-1", "1", "1-2", "2", "2-3", "3", "3-4", "4"]);
  });

  it("labels 'fallo' with the provided failure text", () => {
    expect(rirLabel("fallo", "failure")).toBe("failure");
  });

  it("renders ranges with an en-dash and plain values unchanged", () => {
    expect(rirLabel("2-3")).toBe("2–3");
    expect(rirLabel("2")).toBe("2");
  });
});
