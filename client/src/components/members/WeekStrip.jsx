import { useLanguage } from "../../i18n/LanguageContext";

const localKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function startOfWeek(date) {
  const x = new Date(date);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

// "This week" strip: past/any day shows what you actually trained; the next
// routine day to do is flagged on today only — you train it whenever you want
// (any weekday, rest days wherever), and logging it advances the rotation.
export default function WeekStrip({ workouts, routine, planName, weekName, onPick }) {
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
  const nextDay = days.length ? days[(routine?.nextIndex || 0) % days.length] : null;

  const cells = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localKey(d);
    const done = byDay[key];
    const isPast = key < todayKey;
    const isToday = key === todayKey;

    // Only flag the next routine day on today — no fixed weekday schedule.
    const plan = !done && isToday && nextDay ? nextDay : null;
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
                {planName && <span className="text-[0.58rem] text-warm-gray block leading-tight truncate">{planName}</span>}
                <span className="text-[0.62rem] text-forest font-semibold block leading-tight truncate">✓ {c.done[0].title}</span>
              </button>
            ) : c.plan ? (
              <div className="flex-1">
                <span className="text-[0.55rem] font-semibold text-terracotta/70 block leading-tight uppercase tracking-wide">{tr.upNext}</span>
                {planName && <span className="text-[0.58rem] text-warm-gray block leading-tight truncate">{planName}</span>}
                {weekName && <span className="text-[0.58rem] text-warm-gray block leading-tight truncate">{weekName}</span>}
                <span className="text-[0.62rem] font-semibold text-terracotta block leading-tight truncate">{c.plan.name}</span>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[0.6rem] text-light-gray">·</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
