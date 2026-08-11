import { useLanguage } from "../../i18n/LanguageContext";

// Read-only display of a workout's session feedback (cardio, intensity, effort, per-muscle).
const CARDIO_NAMES = {
  walk: ["Caminadora", "Treadmill"], bike: ["Bici", "Bike"], row: ["Remo", "Rowing"],
  stair: ["Escaladora", "Stair"], ellip: ["Elíptica", "Elliptical"], incline: ["Inclinada", "Incline"],
  hiit: ["HIIT", "HIIT"], rope: ["Cuerda", "Jump rope"],
};

export default function SessionFeedback({ workout, tr }) {
  const { lang } = useLanguage();
  if (!workout) return null;
  const effortLabel = (k) =>
    ({ easy: tr.effortEasy, moderate: tr.effortModerate, hard: tr.effortHard, limit: tr.effortLimit }[k] || k);
  const mi = workout.muscle_intensity || {};
  const miEntries = Object.entries(mi);
  const cardio = workout.cardio && typeof workout.cardio === "object" ? workout.cardio : null;
  const hasFeedback = workout.session_feel || workout.session_effort || miEntries.length > 0 || cardio;
  if (!hasFeedback) return null;

  const cardioSummary = () => {
    const es = lang === "es";
    const parts = [];
    const nm = CARDIO_NAMES[cardio.type];
    if (nm) parts.push(es ? nm[0] : nm[1]);
    if (cardio.duration) parts.push(cardio.duration);
    if (cardio.distance) parts.push(cardio.distance);
    if (cardio.pulse) parts.push(cardio.pulse);
    if (cardio.rpe) parts.push(`RPE ${cardio.rpe}`);
    return parts.join(" · ");
  };

  return (
    <div className="mt-3 grid gap-1 text-[0.8rem] text-warm-gray">
      {cardio ? (
        <div><span className="font-semibold text-charcoal">Cardio:</span> {cardioSummary()}</div>
      ) : null}
      {workout.session_feel ? (
        <div><span className="font-semibold text-charcoal">{tr.feelLabel}:</span> {workout.session_feel}/10</div>
      ) : null}
      {workout.session_effort ? (
        <div><span className="font-semibold text-charcoal">{tr.effortLabel}:</span> {effortLabel(workout.session_effort)}</div>
      ) : null}
      {miEntries.length > 0 ? (
        <div>
          <span className="font-semibold text-charcoal">{tr.muscleIntensityLabel}:</span>{" "}
          {miEntries.map(([k, v]) => `${k} ${v}/5`).join(" · ")}
        </div>
      ) : null}
    </div>
  );
}
