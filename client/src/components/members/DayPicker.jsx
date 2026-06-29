import { useLanguage } from "../../i18n/LanguageContext";

// Shared "what do you want to do this day?" modal used by both the calendar
// and the This Week strip. Lets the member open a logged workout, start a
// workout from their plan, or start a blank one — all dated to the tapped day.
export default function DayPicker({ dateKey, dayWorkouts, planDays, onPick, onStartPlanned, onStartBlank, onClose }) {
  const { t, lang } = useLanguage();
  const tr = t.tracker;

  const label = (() => {
    const [yy, mm, dd] = dateKey.split("-").map(Number);
    return new Date(yy, mm - 1, dd).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "long", day: "numeric", month: "long" });
  })();

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-charcoal/40 p-0 sm:p-5" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-[440px] rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-warm-gray">{tr.calPickTitle}</div>
            <div className="font-display text-[1.25rem] font-semibold text-charcoal capitalize">{label}</div>
          </div>
          <button onClick={onClose} aria-label={tr.cancel} className="text-warm-gray hover:text-charcoal text-2xl leading-none">×</button>
        </div>

        {/* Already logged this day */}
        {dayWorkouts && dayWorkouts.length > 0 && (
          <div className="mb-4">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-forest mb-2">{tr.calLoggedLabel}</div>
            <div className="grid gap-2">
              {dayWorkouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => { onClose(); onPick(w.id); }}
                  className="text-left bg-sage-light/25 border border-sage-light rounded-xl px-4 py-3 hover:bg-sage-light/40 transition-colors"
                >
                  <span className="text-[0.88rem] font-semibold text-forest block">✓ {w.title}</span>
                  <span className="text-[0.74rem] text-warm-gray">{w.exercise_count} {tr.exercises} · {w.set_count} {tr.sets}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Choose a workout from the plan to do on this day */}
        {planDays.length > 0 && (
          <div className="mb-4">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-terracotta mb-2">{tr.calPlannedLabel}</div>
            <div className="grid gap-2">
              {planDays.map((pd) => (
                <button
                  key={`${pd.wi}-${pd.di}`}
                  onClick={() => { onClose(); onStartPlanned(pd.wi, pd.di, dateKey); }}
                  className="text-left border border-sand rounded-xl px-4 py-3 hover:border-terracotta hover:bg-terracotta/5 transition-colors"
                >
                  <span className="text-[0.88rem] font-semibold text-charcoal block">{pd.day}</span>
                  <span className="text-[0.74rem] text-warm-gray">{pd.week} · {pd.count} {tr.exercises}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blank workout on this day */}
        <button
          onClick={() => { onClose(); onStartBlank(dateKey); }}
          className="w-full text-center border-2 border-dashed border-sage-light text-forest font-semibold py-3 rounded-xl hover:bg-sage-light/20 transition-colors"
        >
          + {tr.calBlankBtn}
        </button>
      </div>
    </div>
  );
}
