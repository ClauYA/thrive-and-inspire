// Read-only display of a workout's session feedback (intensity, effort, per-muscle).
export default function SessionFeedback({ workout, tr }) {
  if (!workout) return null;
  const effortLabel = (k) =>
    ({ easy: tr.effortEasy, moderate: tr.effortModerate, hard: tr.effortHard, limit: tr.effortLimit }[k] || k);
  const mi = workout.muscle_intensity || {};
  const miEntries = Object.entries(mi);
  const hasFeedback = workout.session_feel || workout.session_effort || miEntries.length > 0;
  if (!hasFeedback) return null;

  return (
    <div className="mt-3 grid gap-1 text-[0.8rem] text-warm-gray">
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
