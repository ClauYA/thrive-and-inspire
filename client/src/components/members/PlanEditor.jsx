import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";
import { Button, Input, Textarea, Select, Field } from "../ui";

const DAY_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

export default function PlanEditor() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === "new";

  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [weeks, setWeeks] = useState(8);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const exName = (eid) => exercises.find((e) => e.id === eid)?.name || "—";

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const ex = await userApi("/api/exercises");
        setExercises(ex.exercises);
        if (!isNew) {
          const d = await userApi(`/api/plans/${id}`);
          const p = d.plan;
          setName(p.name);
          setObjective(p.objective || "");
          setWeeks(p.weeks || 8);
          setStartDate(p.startDate ? String(p.startDate).slice(0, 10) : "");
          setEndDate(p.endDate ? String(p.endDate).slice(0, 10) : "");
          setDays(p.days.map((x) => ({ name: x.name, exerciseIds: x.exerciseIds, notes: x.notes || "" })));
        } else {
          setName("");
          setDays([
            { name: "Day A", exerciseIds: [], notes: "" },
            { name: "Day B", exerciseIds: [], notes: "" },
            { name: "Day C", exerciseIds: [], notes: "" },
          ]);
        }
        setLoading(false);
      } catch (e) {
        if (e.unauthorized) navigate("/login");
        else {
          setError(e.message);
          setLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addDay = () => setDays((d) => [...d, { name: `Day ${DAY_LETTERS[d.length] || d.length + 1}`, exerciseIds: [], notes: "" }]);
  const removeDay = (di) => setDays((d) => d.filter((_, i) => i !== di));
  const setDayField = (di, field) => (e) => setDays((d) => d.map((day, i) => (i === di ? { ...day, [field]: e.target.value } : day)));
  const addExercise = (di) => (e) => {
    const eid = e.target.value;
    if (!eid) return;
    setDays((d) => d.map((day, i) => (i === di && !day.exerciseIds.includes(eid) ? { ...day, exerciseIds: [...day.exerciseIds, eid] } : day)));
    e.target.value = "";
  };
  const removeExercise = (di, eid) =>
    setDays((d) => d.map((day, i) => (i === di ? { ...day, exerciseIds: day.exerciseIds.filter((x) => x !== eid) } : day)));

  const save = async () => {
    setSaving(true);
    setError("");
    const body = { name, objective, weeks: Number(weeks) || 8, startDate: startDate || null, endDate: endDate || null, days };
    try {
      if (isNew) await userApi("/api/plans", "POST", body);
      else await userApi(`/api/plans/${id}`, "PUT", body);
      navigate("/app/plans");
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
        <button onClick={() => navigate("/app/plans")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>
        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-6">{isNew ? tr.newPlanTitle : tr.editPlanTitle}</h1>

        {loading ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-sand p-5 mb-5 grid gap-4">
              <Field label={tr.planName}>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr.planNamePh} />
              </Field>
              <Field label={tr.objective}>
                <Input type="text" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder={tr.objectivePh} />
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label={tr.weeksLabel}>
                  <Select value={weeks} onChange={(e) => setWeeks(e.target.value)}>
                    {[4, 6, 8, 10, 12, 16].map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={tr.startDateLabel}>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label={tr.endDateLabel}>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>
            </div>

            {days.map((day, di) => (
              <div key={di} className="bg-white rounded-2xl border border-sand p-5 mb-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Input type="text" value={day.name} onChange={setDayField(di, "name")} className="font-semibold" />
                  <button onClick={() => removeDay(di)} aria-label={tr.removeDay} className="shrink-0 text-warm-gray hover:text-red-500 text-xl leading-none px-1">
                    ×
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {day.exerciseIds.length === 0 && <span className="text-[0.82rem] text-light-gray">{tr.noExercisesYet}</span>}
                  {day.exerciseIds.map((eid) => (
                    <span key={eid} className="inline-flex items-center gap-1.5 bg-sage-light/40 text-forest text-[0.8rem] font-medium px-3 py-1 rounded-full">
                      {exName(eid)}
                      <button onClick={() => removeExercise(di, eid)} className="text-forest/60 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <Select onChange={addExercise(di)} defaultValue="" className="mb-3">
                  <option value="">+ {tr.addExercise}</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                      {ex.muscle_group ? ` · ${ex.muscle_group}` : ""}
                    </option>
                  ))}
                </Select>
                <Field label={tr.dayNotes}>
                  <Textarea rows={2} value={day.notes} onChange={setDayField(di, "notes")} placeholder={tr.dayNotesPh} />
                </Field>
              </div>
            ))}

            <button onClick={addDay} className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3 rounded-2xl hover:bg-sage-light/20 transition-colors mb-6">
              + {tr.addDay}
            </button>

            {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

            <div className="flex gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? tr.saving : tr.savePlan}
              </Button>
              <button onClick={() => navigate("/app/plans")} className="text-[0.95rem] font-semibold px-6 py-3.5 rounded-full border border-sand text-warm-gray hover:bg-sand transition-colors">
                {tr.cancel}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
