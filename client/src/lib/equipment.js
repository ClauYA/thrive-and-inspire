// Normalize an exercise's equipment value (English or Spanish, mixed in the DB)
// to a consistent English label + icon for the "you'll need today" chips.
const EQUIP = {
  barbell: { label: "Barbell", icon: "🏋️" },
  barra: { label: "Barbell", icon: "🏋️" },
  dumbbell: { label: "Dumbbell", icon: "🔩" },
  dumbbells: { label: "Dumbbell", icon: "🔩" },
  mancuernas: { label: "Dumbbell", icon: "🔩" },
  mancuerna: { label: "Dumbbell", icon: "🔩" },
  machine: { label: "Machine", icon: "⚙️" },
  "leverage machine": { label: "Machine", icon: "⚙️" },
  máquina: { label: "Machine", icon: "⚙️" },
  maquina: { label: "Machine", icon: "⚙️" },
  cable: { label: "Cable", icon: "🪝" },
  polea: { label: "Cable", icon: "🪝" },
  bodyweight: { label: "Bodyweight", icon: "🧍" },
  "body weight": { label: "Bodyweight", icon: "🧍" },
  "peso corporal": { label: "Bodyweight", icon: "🧍" },
  kettlebell: { label: "Kettlebell", icon: "🔔" },
  band: { label: "Band", icon: "🎗️" },
  banda: { label: "Band", icon: "🎗️" },
  smith: { label: "Smith Machine", icon: "⚙️" },
  "smith machine": { label: "Smith Machine", icon: "⚙️" },
};

// { label, icon } for a raw equipment value; unknown values pass through with a
// default icon. Returns null for empty input.
export function equipmentInfo(raw) {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  return EQUIP[key] || { label: String(raw).trim(), icon: "🏋️" };
}

// Distinct equipment (deduped by canonical label) across a list of exercise
// objects that each have an `equipment` field. Returns [{ label, icon }].
export function equipmentChips(exercises) {
  const byLabel = {};
  for (const ex of exercises || []) {
    const info = equipmentInfo(ex && ex.equipment);
    if (info) byLabel[info.label] = info;
  }
  return Object.values(byLabel);
}
