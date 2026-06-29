import { useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

const localKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Calendar({ workouts, onPick, plan, onStartPlanned, onStartBlank }) {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(null); // "YYYY-MM-DD" of the tapped day

  // Map "YYYY-MM-DD" → array of workouts on that day.
  const byDay = useMemo(() => {
    const map = {};
    for (const w of workouts) {
      const k = localKey(w.performed_at);
      (map[k] = map[k] || []).push(w);
    }
    return map;
  }, [workouts]);

  // Flat list of the plan's workout days, so the picker can offer each one.
  const planDays = useMemo(() => {
    const out = [];
    (plan?.weeks || []).forEach((w, wi) =>
      (w.days || []).forEach((d, di) =>
        out.push({ wi, di, week: w.name, day: d.name, count: (d.exercises || []).length })
      )
    );
    return out;
  }, [plan]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "long", year: "numeric" });
  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 7); // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "short" })
    );
  }, [lang]);

  const firstDay = new Date(cursor.y, cursor.m, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const move = (delta) =>
    setCursor((c) => {
      const m = c.m + delta;
      return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  const todayKey = localKey(new Date().toISOString());

  // Pretty label for the selected day inside the picker.
  const selectedLabel = selected
    ? (() => {
        const [yy, mm, dd] = selected.split("-").map(Number);
        return new Date(yy, mm - 1, dd).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "long", day: "numeric", month: "long" });
      })()
    : "";
  const selectedWorkouts = selected ? byDay[selected] : null;
  const close = () => setSelected(null);

  return (
    <div className="bg-white rounded-2xl border border-sand p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => move(-1)} className="w-8 h-8 rounded-full hover:bg-sand text-warm-gray flex items-center justify-center">‹</button>
        <span className="font-semibold text-charcoal capitalize">{monthLabel}</span>
        <button onClick={() => move(1)} className="w-8 h-8 rounded-full hover:bg-sand text-warm-gray flex items-center justify-center">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] text-warm-gray mb-1">
        {weekdays.map((w, i) => (
          <span key={i} className="capitalize">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const key = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const has = !!byDay[key];
          const isToday = key === todayKey;
          return (
            <button
              key={i}
              onClick={() => setSelected(key)}
              className={`aspect-square rounded-xl text-[0.82rem] flex flex-col items-center justify-center transition-all hover:bg-terracotta/15 cursor-pointer ${
                has ? "bg-terracotta/10 text-terracotta-dark font-semibold" : "text-charcoal/70"
              } ${isToday ? "ring-2 ring-sage" : ""}`}
            >
              {d}
              {has && <span className="w-1.5 h-1.5 rounded-full bg-terracotta mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Day picker: choose which plan workout to do on the tapped day */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-charcoal/40 p-0 sm:p-5" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-[440px] rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-[0.7rem] uppercase tracking-[0.1em] text-warm-gray">{tr.calPickTitle}</div>
                <div className="font-display text-[1.25rem] font-semibold text-charcoal capitalize">{selectedLabel}</div>
              </div>
              <button onClick={close} aria-label={tr.cancel} className="text-warm-gray hover:text-charcoal text-2xl leading-none">×</button>
            </div>

            {/* Already logged this day */}
            {selectedWorkouts && (
              <div className="mb-4">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-forest mb-2">{tr.calLoggedLabel}</div>
                <div className="grid gap-2">
                  {selectedWorkouts.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => { close(); onPick(w.id); }}
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
                      onClick={() => { close(); onStartPlanned(pd.wi, pd.di, selected); }}
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
              onClick={() => { close(); onStartBlank(selected); }}
              className="w-full text-center border-2 border-dashed border-sage-light text-forest font-semibold py-3 rounded-xl hover:bg-sage-light/20 transition-colors"
            >
              + {tr.calBlankBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
