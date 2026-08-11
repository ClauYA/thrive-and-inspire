// Reusable session-feedback questions: intensity slider, effort pills, per-muscle mood.
// Shared by the strength logger and the cardio screens. Pure UI (controlled inputs).

const MOOD_SCALE = ["#db2e63", "#e07a3f", "#e0a020", "#63b4bd", "#0f6d78"];

function MoodFace({ level = 3, color = "currentColor", size = 18 }) {
  const mouths = {
    1: "M8 16 Q12 12 16 16",
    2: "M8 15.5 Q12 13.5 16 15.5",
    3: "M8 15 H16",
    4: "M8 14 Q12 17 16 14",
    5: "M8 13.5 Q12 18 16 13.5",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="9" cy="10" r="0.7" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="0.7" fill={color} stroke="none" />
      <path d={mouths[level] || mouths[3]} />
    </svg>
  );
}

export default function SessionFeedbackForm({
  tr,
  sessionFeel,
  setSessionFeel,
  sessionEffort,
  setSessionEffort,
  muscleIntensity = {},
  setMuscleIntensity,
  workedMuscles = [],
  showMuscles = true,
}) {
  const efforts = [
    ["easy", tr.effortEasy],
    ["moderate", tr.effortModerate],
    ["hard", tr.effortHard],
    ["limit", tr.effortLimit],
  ];
  return (
    <>
      {/* Intensity slider */}
      <div>
        <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{tr.sessionFeelQ}</label>
        <input
          type="range" min="1" max="10" step="1"
          value={Number(sessionFeel) || 5}
          onChange={(e) => setSessionFeel(Number(e.target.value))}
          aria-label={tr.sessionFeelQ}
          className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-terracotta [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-terracotta"
          style={{ background: "linear-gradient(90deg,#63b4bd,#e0a020,#db2e63)" }}
        />
        <div className="mt-1 text-right text-[0.8rem] font-semibold text-forest">{sessionFeel ? `${sessionFeel} / 10` : "-"}</div>
      </div>

      {/* Effort pills */}
      <div>
        <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{tr.effortQ}</label>
        <div className="flex flex-wrap gap-2">
          {efforts.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSessionEffort(k)}
              className={`px-4 py-2 rounded-full text-[0.82rem] font-semibold border transition-colors ${
                sessionEffort === k ? "bg-terracotta text-white border-terracotta" : "bg-sage-light/50 text-forest border-transparent hover:bg-sage-light"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Per-muscle mood */}
      {showMuscles && workedMuscles.length > 0 && (
        <div>
          <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{tr.muscleIntensityQ}</label>
          <div className="grid gap-2.5">
            {workedMuscles.map((m) => (
              <div key={m} className="flex items-center justify-between gap-3">
                <span className="text-[0.85rem] text-charcoal capitalize">{m}</span>
                <div className="flex gap-1.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = Number(muscleIntensity[m]) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${m} ${n}`}
                        onClick={() => setMuscleIntensity((mi) => ({ ...mi, [m]: n }))}
                        className="w-8 h-8 rounded-full grid place-items-center border transition-colors"
                        style={active ? { background: "#bfe0da", borderColor: "#511a54" } : { background: "#fff", borderColor: "#e2dee3" }}
                      >
                        <MoodFace level={n} color={MOOD_SCALE[n - 1]} size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
