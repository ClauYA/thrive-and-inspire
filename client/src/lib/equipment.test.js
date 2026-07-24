import { describe, it, expect } from "vitest";
import { equipmentInfo, equipmentChips } from "./equipment.js";

describe("equipmentInfo", () => {
  it("normalizes Spanish and English to one English label", () => {
    expect(equipmentInfo("Barra").label).toBe("Barbell");
    expect(equipmentInfo("barbell").label).toBe("Barbell");
    expect(equipmentInfo("Mancuernas").label).toBe("Dumbbell");
    expect(equipmentInfo("Máquina").label).toBe("Machine");
    expect(equipmentInfo("Polea").label).toBe("Cable");
    expect(equipmentInfo("Peso corporal").label).toBe("Bodyweight");
  });

  it("returns an icon and passes unknown values through", () => {
    expect(equipmentInfo("Barra").icon).toBeTruthy();
    expect(equipmentInfo("Trap Bar")).toEqual({ label: "Trap Bar", icon: "🏋️" });
  });

  it("returns null for empty input", () => {
    expect(equipmentInfo("")).toBe(null);
    expect(equipmentInfo(null)).toBe(null);
  });
});

describe("equipmentChips", () => {
  it("dedupes by canonical label (Barra + Barbell -> one)", () => {
    const chips = equipmentChips([
      { equipment: "Barra" }, { equipment: "Barbell" }, { equipment: "Mancuernas" }, { equipment: "" }, null,
    ]);
    const labels = chips.map((c) => c.label).sort();
    expect(labels).toEqual(["Barbell", "Dumbbell"]);
  });
});
