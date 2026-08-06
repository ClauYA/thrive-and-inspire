import { useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

const localKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Calendar({ workouts, onPick }) {
  const { lang } = useLanguage();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // Map "YYYY-MM-DD" → array of workouts on that day.
  const byDay = useMemo(() => {
    const map = {};
    for (const w of workouts) {
      const k = localKey(w.performed_at);
      (map[k] = map[k] || []).push(w);
    }
    return map;
  }, [workouts]);

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
          const dayWorkouts = byDay[key];
          const has = !!dayWorkouts;
          const isToday = key === todayKey;
          return (
            <button
              key={i}
              onClick={() => has && onPick(dayWorkouts[0].id)}
              disabled={!has}
              className={`aspect-square rounded-xl text-[0.82rem] flex flex-col items-center justify-center transition-all ${
                has ? "bg-terracotta/10 text-terracotta-dark font-semibold hover:bg-terracotta/20 cursor-pointer" : "text-charcoal/70"
              } ${isToday ? "ring-2 ring-sage" : ""}`}
            >
              {d}
              {has && <span className="w-1.5 h-1.5 rounded-full bg-terracotta mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
