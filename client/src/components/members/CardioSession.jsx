import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import SessionFeedbackForm from "./SessionFeedbackForm";
import { Button } from "../ui";

// Cardio logging screen (UI only, local state).
// mode="mixed" = strength day that also has cardio -> feedback includes muscles.
// mode="only"  = cardio-only day -> short feedback (no muscles).
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

const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";

export default function CardioSession({ mode = "mixed", workedMuscles = [] }) {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const es = lang === "es";
  const L = {
    coach: es ? "NOTA DEL COACH" : "COACH NOTE",
    coachNote: es ? "20 min Zona 2 · pulso 120–140" : "20 min Zone 2 · HR 120–140",
    q: es ? "¿Qué cardio harás hoy?" : "What cardio today?",
    duration: es ? "DURACIÓN" : "DURATION",
    distance: es ? "DISTANCIA" : "DISTANCE",
    pulse: es ? "PULSO PROM." : "AVG HEART RATE",
    rpe: "RPE (1–10)",
    notes: es ? "NOTAS" : "NOTES",
    notesPh: es ? "¿Cómo te sentiste? Sensaciones, zona…" : "How did it feel? Sensations, zone…",
    save: es ? "Guardar cardio" : "Save cardio",
    feedback: es ? "Feedback de la sesión" : "Session feedback",
  };

  const [type, setType] = useState("bike");
  const [dur, setDur] = useState("");
  const [dist, setDist] = useState("");
  const [pulse, setPulse] = useState("");
  const [rpe, setRpe] = useState(0);
  const [cnotes, setCnotes] = useState("");
  const [feel, setFeel] = useState(7);
  const [effort, setEffort] = useState("hard");
  const [mi, setMi] = useState({});

  return (
    <div className="grid gap-4">
      {/* Cardio card */}
      <div className="bg-white rounded-2xl border border-sand p-5 grid gap-4">
        <div className="rounded-xl bg-cream border-l-2 border-terracotta pl-3 py-2">
          <div className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray mb-1">{L.coach}</div>
          <div className="text-[0.82rem] text-charcoal">{L.coachNote}</div>
        </div>

        <div>
          <div className="text-[0.9rem] font-semibold text-charcoal mb-2">{L.q}</div>
          <div className="grid grid-cols-4 gap-2">
            {CARDIO.map(([k, icon, esL, enL]) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[0.66rem] font-semibold transition-colors ${
                  type === k ? "bg-terracotta text-white border-terracotta" : "bg-white text-charcoal border-sand hover:border-terracotta-light"
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
            <input value={dur} onChange={(e) => setDur(e.target.value)} placeholder="00:00" className={inputClass} />
          </label>
          <label className="grid gap-1">
            <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.distance}</span>
            <input value={dist} onChange={(e) => setDist(e.target.value)} placeholder="3.2 km" className={inputClass} />
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.pulse}</span>
          <input value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="128 bpm" className={inputClass} />
        </label>

        <div>
          <div className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray mb-1.5">{L.rpe}</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRpe(n)}
                className={`w-8 h-8 rounded-full text-[0.8rem] font-semibold border transition-colors ${
                  rpe === n ? "bg-terracotta text-white border-terracotta" : "bg-white text-warm-gray border-sand hover:border-terracotta"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-1">
          <span className="text-[0.62rem] font-bold tracking-[0.08em] text-warm-gray">{L.notes}</span>
          <textarea rows="2" value={cnotes} onChange={(e) => setCnotes(e.target.value)} placeholder={L.notesPh} className={`${inputClass} resize-none`} />
        </label>

        <Button onClick={() => {}}>{L.save}</Button>
      </div>

      {/* Session feedback */}
      <div className="bg-white rounded-2xl border border-sand p-5 grid gap-5">
        <div className="font-display text-[1.15rem] font-semibold text-charcoal">{L.feedback}</div>
        <SessionFeedbackForm
          tr={tr}
          sessionFeel={feel}
          setSessionFeel={setFeel}
          sessionEffort={effort}
          setSessionEffort={setEffort}
          muscleIntensity={mi}
          setMuscleIntensity={setMi}
          workedMuscles={workedMuscles}
          showMuscles={mode === "mixed"}
        />
      </div>
    </div>
  );
}
