import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import SessionFeedbackForm from "./SessionFeedbackForm";
import CardioSession from "./CardioSession";
import { Button } from "../ui";

// DEV PREVIEW — open /preview to see the redesigned feedback + cardio screens
// without logging in. Uses local state only (no API, no auth).
export default function Preview() {
  const { t, lang, toggle } = useLanguage();
  const tr = t.tracker;
  const es = lang === "es";
  const muscles = es ? ["cuádriceps", "glúteos", "isquios"] : ["quads", "glutes", "hamstrings"];

  const [feel, setFeel] = useState(7);
  const [effort, setEffort] = useState("hard");
  const [mi, setMi] = useState({ [muscles[0]]: 5, [muscles[1]]: 4, [muscles[2]]: 2 });

  const H = ({ children }) => (
    <h2 className="font-display text-[1.3rem] font-semibold text-charcoal mb-3">{children}</h2>
  );

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <div className="max-w-[440px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="font-display text-[1.6rem] font-semibold">Preview</div>
          <button onClick={toggle} className="text-[0.8rem] font-semibold px-3 py-1.5 rounded-full border border-sand">
            {es ? "EN" : "ES"}
          </button>
        </div>
        <p className="text-[0.85rem] text-warm-gray mb-8">
          {es
            ? "Vista de prueba (sin login). Muestra las tres pantallas de cierre de sesión."
            : "Preview (no login). Shows the three session-closing screens."}
        </p>

        {/* 1 — strength only */}
        <H>{es ? "1 · Solo fuerza" : "1 · Strength only"}</H>
        <div className="bg-white rounded-2xl border border-sand p-5 grid gap-5 mb-10">
          <div className="font-display text-[1.15rem] font-semibold">{tr.feedbackTitle}</div>
          <SessionFeedbackForm
            tr={tr}
            sessionFeel={feel}
            setSessionFeel={setFeel}
            sessionEffort={effort}
            setSessionEffort={setEffort}
            muscleIntensity={mi}
            setMuscleIntensity={setMi}
            workedMuscles={muscles}
          />
          <Button onClick={() => {}}>{tr.saveAll}</Button>
        </div>

        {/* 2 — mixed */}
        <H>{es ? "2 · Mixto (fuerza + cardio)" : "2 · Mixed (strength + cardio)"}</H>
        <div className="mb-10">
          <CardioSession mode="mixed" workedMuscles={muscles} />
        </div>

        {/* 3 — cardio only */}
        <H>{es ? "3 · Solo cardio" : "3 · Cardio only"}</H>
        <div className="mb-10">
          <CardioSession mode="only" />
        </div>
      </div>
    </div>
  );
}
