import { useLanguage } from "../../i18n/LanguageContext";
import { Check } from "lucide-react";

const localKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function startOfWeek(date) {
  const x = new Date(date);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

// "This week" strip: past days show what was trained; today/future days
// project the upcoming routine rotation with that day's exercises.
export default function WeekStrip({ workouts, routine, exMap, onPick }) {
  const { t, lang } = useLanguage();
  const tr = t.tracker;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = localKey(today);
  const start = startOfWeek(today);

  const byDay = {};
  for (const w of workouts) {
    const k = localKey(new Date(w.performed_at));
    (byDay[k] = byDay[k] || []).push(w);
  }

  const days = routine?.days || [];
  let proj = routine ? routine.nextIndex : 0;

  const cells = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localKey(d);
    const done = byDay[key];
    const isPast = key < todayKey;
    const isToday = key === todayKey;

    let plan = null;
    if (!done && !isPast && days.length) {
      plan = days[proj % days.length];
      proj++;
    }
    return { d, key, done, isPast, isToday, plan };
  });

  const weekdayName = (d) => d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { weekday: "short" });

  return (
    <div className="mb-6">
      <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mb-3">{tr.thisWeek}</h2>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c) => (
          <div
            key={c.key}
            className={`rounded-xl border p-2 min-h-[92px] flex flex-col ${
              c.isToday ? "border-terracotta bg-terracotta/5" : "border-sand bg-white"
            }`}
          >
            <div className="text-[0.62rem] text-warm-gray capitalize text-center">{weekdayName(c.d)}</div>
            <div className={`text-[0.85rem] font-semibold text-center mb-1 ${c.isToday ? "text-terracotta-dark" : "text-charcoal"}`}>
              {c.d.getDate()}
            </div>
            {c.done ? (
              <button onClick={() => onPick(c.done[0].id)} className="flex-1 text-left">
                <span className="text-[0.62rem] text-forest font-semibold flex items-center gap-1 leading-tight"><Check size={11} strokeWidth={3} /> {c.done[0].title}</span>
              </button>
            ) : c.plan ? (
              <div className="flex-1">
                <span className="text-[0.62rem] font-semibold text-terracotta block leading-tight truncate">{c.plan.name}</span>
                <span className="text-[0.58rem] text-warm-gray block leading-tight">
                  {c.plan.exerciseIds.slice(0, 3).map((id) => exMap[id] || "").filter(Boolean).join(", ")}
                  {c.plan.exerciseIds.length > 3 ? ` +${c.plan.exerciseIds.length - 3}` : ""}
                </span>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[0.6rem] text-light-gray">{c.isPast ? "·" : tr.rest}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
