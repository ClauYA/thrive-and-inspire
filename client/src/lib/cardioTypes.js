// Cardio modalities for the logger + display. `type` is stored as the English
// key (stable); labels are localized for display.
export const CARDIO_TYPES = [
  { key: "Treadmill", icon: "🏃", en: "Treadmill", es: "Caminadora" },
  { key: "Bike", icon: "🚴", en: "Bike", es: "Bici" },
  { key: "Rowing", icon: "🚣", en: "Rowing", es: "Remo" },
  { key: "Elliptical", icon: "🏃‍♀️", en: "Elliptical", es: "Elíptica" },
  { key: "Stair", icon: "🧗", en: "Stairmaster", es: "Escaladora" },
  { key: "Walk", icon: "🚶", en: "Incline walk", es: "Caminata inclinada" },
  { key: "HIIT", icon: "⚡", en: "HIIT", es: "HIIT" },
  { key: "JumpRope", icon: "🪢", en: "Jump rope", es: "Cuerda" },
  { key: "Swim", icon: "🏊", en: "Swimming", es: "Nadar" },
  { key: "Other", icon: "💪", en: "Other", es: "Otro" },
];

export function cardioTypeInfo(key, lang) {
  const t = CARDIO_TYPES.find((x) => x.key === key);
  if (!t) return { icon: "🏃", label: key || "" };
  return { icon: t.icon, label: lang === "es" ? t.es : t.en };
}
