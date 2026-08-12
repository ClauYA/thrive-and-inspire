import { useLanguage } from "../../i18n/LanguageContext";

// Controlled cardio inputs. value = { type, duration, distance, pulse, rpe, notes } | null.
const CARDIO = [
  ["walk", "🚶", "Caminadora", "Treadmill"],
  ["bike", "🚴", "Bici", "Bike"],
  ["row", "🚣", "Remo", "Rowing"],
  ["stair", "🧗", "Escaladora", "Stair"],
  ["ellip", "🔁", "Elíptica", "Elliptical"],
  ["incline", "⛰️", "Inclinada", "Incline"],
  ["hiit", "⚡", "HIIT", "HIIT"],
  ["rope", "🪢", "Cuerda", "Jump rope"],
];
const EMPTY = { type: "", duration: "", distance: "", pulse: "", rpe: 0, notes: "" };
const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";

export default function CardioCard({ value, onChange }) {
  const { lang } = useLanguage();
  const es = lang === "es";
  const v = { ...EMPTY, ...(value || {}) };
  const set = (patch) => onChange({ ...v, ...patch });
  const L = {
    q: es ? "¿Qué cardio hiciste?" : "What cardio did you do?",
    duration: es ? "DURACIÓN" : "DURATION",
    distance: es ? "DISTANCIA" : "DISTANCE",
    pulse: es ? "PULSO PROM." : "AVG HEART RATE",
    rpe: "RPE (1–10)",
    notes: es ? "NOTAS" : "NOTES",
    notesPh: es ? "¿Cómo te sentiste? Sensaciones, zona…" : "How did it feel? Sensations, zone…",
  };
  return (
    <div className="grid gap-4">
      <div>
        <div className="text-[0.82rem] font-semibold text-charcoal mb-2">{L.q}</div>
        <div className="grid grid-cols-4 gap-2">
          {CARDIO.map(([k, icon, esL, enL]) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ type: k })}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[0.66rem] font-semibold transition-colors ${
                v.type === k ? "bg-terracotta text-white border-terracotta" : "bg-white text-charcoal border-sand hover:border-terracotta-light"
              }`}
            >
              <span className="text-[1.1rem] leading-none">{icon}</span>
              {es ? esL : enL}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.duration}</span>
          <input value={v.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="00:00" className={inputClass} />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.distance}</span>
          <input value={v.distance} onChange={(e) => set({ distance: e.target.value })} placeholder="3.2 km" className={inputClass} />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.pulse}</span>
        <input value={v.pulse} onChange={(e) => set({ pulse: e.target.value })} placeholder="128 bpm" className={inputClass} />
      </label>

      <div>
        <div className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray mb-1.5">{L.rpe}</div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set({ rpe: n })}
              className={`w-8 h-8 rounded-full text-[0.8rem] font-semibold border transition-colors ${
                Number(v.rpe) === n ? "bg-terracotta text-white border-terracotta" : "bg-white text-warm-gray border-sand hover:border-terracotta"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="grid gap-1">
        <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.notes}</span>
        <textarea rows="2" value={v.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={L.notesPh} className={`${inputClass} resize-none`} />
      </label>
    </div>
  );
}
