import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";

const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";

const DAY_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

export default function RoutineEditor() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState("My Routine");
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const exName = (id) => exercises.find((e) => e.id === id)?.name || "—";

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    Promise.all([userApi("/api/exercises"), userApi("/api/routine")])
      .then(([ex, r]) => {
        setExercises(ex.exercises);
        if (r.routine) {
          setName(r.routine.name);
          setDays(r.routine.days.map((d) => ({ name: d.name, exerciseIds: d.exerciseIds })));
        } else {
          setDays([
            { name: "Day A", exerciseIds: [] },
            { name: "Day B", exerciseIds: [] },
            { name: "Day C", exerciseIds: [] },
          ]);
        }
        setLoading(false);
      })
      .catch((e) => {
        if (e.unauthorized) navigate("/login");
        else {
          setError(e.message);
          setLoading(false);
        }
      });
  }, [navigate]);

  const addDay = () => setDays((d) => [...d, { name: `Day ${DAY_LETTERS[d.length] || d.length + 1}`, exerciseIds: [] }]);
  const removeDay = (di) => setDays((d) => d.filter((_, i) => i !== di));
  const setDayName = (di) => (e) => setDays((d) => d.map((day, i) => (i === di ? { ...day, name: e.target.value } : day)));
  const addExercise = (di) => (e) => {
    const id = e.target.value;
    if (!id) return;
    setDays((d) => d.map((day, i) => (i === di && !day.exerciseIds.includes(id) ? { ...day, exerciseIds: [...day.exerciseIds, id] } : day)));
    e.target.value = "";
  };
  const removeExercise = (di, id) =>
    setDays((d) => d.map((day, i) => (i === di ? { ...day, exerciseIds: day.exerciseIds.filter((x) => x !== id) } : day)));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await userApi("/api/routine", "PUT", { name, days });
      navigate("/app");
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[760px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>
        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-2">{tr.routineTitle}</h1>
        <p className="text-[0.88rem] text-warm-gray mb-6">{tr.routineSub}</p>

        {loading ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-sand p-5 mb-5">
              <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.routineName}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>

            {days.map((day, di) => (
              <div key={di} className="bg-white rounded-2xl border border-sand p-5 mb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <input type="text" value={day.name} onChange={setDayName(di)} className={`${inputClass} font-semibold`} />
                  <button onClick={() => removeDay(di)} aria-label={tr.removeDay} className="shrink-0 text-warm-gray hover:text-red-500 text-xl leading-none px-1">
                    ×
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {day.exerciseIds.length === 0 && <span className="text-[0.82rem] text-light-gray">{tr.noExercisesYet}</span>}
                  {day.exerciseIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1.5 bg-sage-light/40 text-forest text-[0.8rem] font-medium px-3 py-1 rounded-full">
                      {exName(id)}
                      <button onClick={() => removeExercise(di, id)} className="text-forest/60 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <select onChange={addExercise(di)} defaultValue="" className={`${inputClass} cursor-pointer`}>
                  <option value="">+ {tr.addExercise}</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                      {ex.muscle_group ? ` · ${ex.muscle_group}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button onClick={addDay} className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3 rounded-2xl hover:bg-sage-light/20 transition-colors mb-6">
              + {tr.addDay}
            </button>

            {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="bg-terracotta text-white text-[0.95rem] font-semibold px-6 py-3.5 rounded-full hover:bg-terracotta-dark transition-colors shadow-[0_8px_24px_rgba(176,125,31,0.3)] disabled:opacity-70">
                {saving ? tr.saving : tr.saveRoutine}
              </button>
              <button onClick={() => navigate("/app")} className="text-[0.95rem] font-semibold px-6 py-3.5 rounded-full border border-sand text-warm-gray hover:bg-sand transition-colors">
                {tr.cancel}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
