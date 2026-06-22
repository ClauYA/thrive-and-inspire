import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";
import { Button, Input, Textarea, Select, Field } from "../ui";
import { RIR_OPTIONS, rirLabel } from "../../lib/rir";
const newExercise = () => ({ exerciseId: "", sets: 3, reps: "", rir: "", notes: "" });
const newDay = (n) => ({ name: `Día ${n}`, notes: "", exercises: [] });
const newWeek = (n) => ({ name: `Semana ${n}`, notes: "", days: [newDay(1)] });

export default function PlanEditor() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === "new";

  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
          setStartDate(p.startDate ? String(p.startDate).slice(0, 10) : "");
          setEndDate(p.endDate ? String(p.endDate).slice(0, 10) : "");
          setWeeks(
            (p.weeks || []).map((w) => ({
              name: w.name,
              notes: w.notes || "",
              days: (w.days || []).map((dd) => ({
                name: dd.name,
                notes: dd.notes || "",
                exercises: (dd.exercises || []).map((e) => ({
                  exerciseId: e.exerciseId || "",
                  sets: e.sets ?? 3,
                  reps: e.reps || "",
                  rir: e.rir || "",
                  notes: e.notes || "",
                })),
              })),
            }))
          );
        } else {
          setName("");
          setWeeks([newWeek(1)]);
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

  // Immutable helpers ------------------------------------------------------
  const updWeeks = (fn) => setWeeks((ws) => fn(ws.map((w) => ({ ...w, days: w.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })) }))));

  const addWeek = () => updWeeks((ws) => [...ws, newWeek(ws.length + 1)]);
  const removeWeek = (wi) => updWeeks((ws) => ws.filter((_, i) => i !== wi));
  const duplicateWeek = (wi) => updWeeks((ws) => {
    const copy = JSON.parse(JSON.stringify(ws[wi]));
    copy.name = `${copy.name} (copia)`;
    return [...ws.slice(0, wi + 1), copy, ...ws.slice(wi + 1)];
  });
  const setWeekField = (wi, f) => (e) => updWeeks((ws) => { ws[wi][f] = e.target.value; return ws; });

  const addDay = (wi) => updWeeks((ws) => { ws[wi].days.push(newDay(ws[wi].days.length + 1)); return ws; });
  const removeDay = (wi, di) => updWeeks((ws) => { ws[wi].days = ws[wi].days.filter((_, i) => i !== di); return ws; });
  const setDayField = (wi, di, f) => (e) => updWeeks((ws) => { ws[wi].days[di][f] = e.target.value; return ws; });

  const addEx = (wi, di) => updWeeks((ws) => { ws[wi].days[di].exercises.push(newExercise()); return ws; });
  const removeEx = (wi, di, ei) => updWeeks((ws) => { ws[wi].days[di].exercises = ws[wi].days[di].exercises.filter((_, i) => i !== ei); return ws; });
  const setExField = (wi, di, ei, f) => (e) => updWeeks((ws) => { ws[wi].days[di].exercises[ei][f] = e.target.value; return ws; });

  const save = async () => {
    setSaving(true);
    setError("");
    const body = { name, objective, startDate: startDate || null, endDate: endDate || null, weeks };
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
      <main className="max-w-[820px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app/plans")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>
        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-6">{isNew ? tr.newPlanTitle : tr.editPlanTitle}</h1>

        {loading ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : (
          <>
            {/* Mesocycle header */}
            <div className="bg-white rounded-2xl border border-sand p-5 mb-5 grid gap-4">
              <Field label={tr.planName}>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr.planNamePh} />
              </Field>
              <Field label={tr.objective}>
                <Input type="text" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder={tr.objectivePh} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={tr.startDateLabel}>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label={tr.endDateLabel}>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="bg-sage-light/15 rounded-2xl border border-sage-light p-4 mb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wide text-forest shrink-0">{tr.weekLabel} {wi + 1}</span>
                    <Input type="text" value={week.name} onChange={setWeekField(wi, "name")} placeholder={tr.weekNamePh} className="font-semibold" />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => duplicateWeek(wi)} className="text-[0.74rem] font-semibold text-forest border border-sage-light bg-white px-2.5 py-1.5 rounded-full hover:bg-sage-light/40">
                      ⧉ {tr.duplicateWeek}
                    </button>
                    <button onClick={() => removeWeek(wi)} aria-label={tr.removeWeek} className="text-warm-gray hover:text-red-500 text-xl leading-none px-1">×</button>
                  </div>
                </div>
                <Textarea rows={1} value={week.notes} onChange={setWeekField(wi, "notes")} placeholder={tr.weekNotes} className="mb-3 bg-white" />

                {/* Days */}
                {week.days.map((day, di) => (
                  <div key={di} className="bg-white rounded-xl border border-sand p-4 mb-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Input type="text" value={day.name} onChange={setDayField(wi, di, "name")} placeholder={tr.dayNamePh} className="font-semibold" />
                      <button onClick={() => removeDay(wi, di)} aria-label={tr.removeDay} className="shrink-0 text-warm-gray hover:text-red-500 text-xl leading-none px-1">×</button>
                    </div>

                    {/* Exercises with targets */}
                    {day.exercises.length > 0 && (
                      <div className="grid grid-cols-[1fr_50px_64px_72px_24px] gap-1.5 items-center text-[0.66rem] font-semibold text-warm-gray mb-1 px-0.5">
                        <span>{tr.colExercise}</span>
                        <span className="text-center">{tr.exTargetSets}</span>
                        <span className="text-center">{tr.exTargetReps}</span>
                        <span className="text-center">{tr.exTargetRir}</span>
                        <span />
                      </div>
                    )}
                    {day.exercises.map((ex, ei) => (
                      <div key={ei} className="grid grid-cols-[1fr_50px_64px_72px_24px] gap-1.5 items-center mb-1.5">
                        <Select value={ex.exerciseId} onChange={setExField(wi, di, ei, "exerciseId")} className="text-[0.82rem] py-2">
                          <option value="">{tr.selectExercise}</option>
                          {exercises.map((x) => (
                            <option key={x.id} value={x.id}>{x.name}{x.muscle_group ? ` · ${x.muscle_group}` : ""}</option>
                          ))}
                        </Select>
                        <Input type="number" inputMode="numeric" value={ex.sets} onChange={setExField(wi, di, ei, "sets")} className="text-center px-1 py-2" />
                        <Input type="text" value={ex.reps} onChange={setExField(wi, di, ei, "reps")} placeholder="8-10" className="text-center px-1 py-2" />
                        <Select value={ex.rir} onChange={setExField(wi, di, ei, "rir")} className="text-center px-1 py-2">
                          <option value="">–</option>
                          {RIR_OPTIONS.map((o) => (
                            <option key={o} value={o}>{rirLabel(o, tr.failure)}</option>
                          ))}
                        </Select>
                        <button onClick={() => removeEx(wi, di, ei)} aria-label={tr.removeExercise} className="text-warm-gray hover:text-red-500 text-lg leading-none">−</button>
                      </div>
                    ))}
                    <button onClick={() => addEx(wi, di)} className="text-[0.8rem] font-semibold text-terracotta hover:text-terracotta-dark mt-1">
                      + {tr.addExerciseRow}
                    </button>
                  </div>
                ))}

                <button onClick={() => addDay(wi)} className="w-full border-2 border-dashed border-sand text-warm-gray font-semibold py-2.5 rounded-xl hover:bg-white/60 transition-colors text-[0.85rem]">
                  + {tr.addDay}
                </button>
              </div>
            ))}

            <button onClick={addWeek} className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3 rounded-2xl hover:bg-sage-light/20 transition-colors mb-6">
              + {tr.addWeek}
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
