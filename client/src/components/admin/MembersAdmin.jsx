import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiAuth } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useLanguage } from "../../i18n/LanguageContext";
import LineChart from "../members/LineChart";
import SessionFeedback from "../members/SessionFeedback";

// Group a flat list of sets by exercise, preserving first-seen order.
function groupByExercise(sets) {
  const groups = [];
  const map = new Map();
  for (const s of sets) {
    if (!map.has(s.exercise_name)) {
      const g = { name: s.exercise_name, sets: [] };
      map.set(s.exercise_name, g);
      groups.push(g);
    }
    map.get(s.exercise_name).sets.push(s);
  }
  return groups;
}

// Coach view: list members, inspect their workouts, manage plans.
export default function MembersAdmin({ onAuthError }) {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const [members, setMembers] = useState(null);
  const [sel, setSel] = useState(null); // selected member detail { member, workouts, plans }
  const [expanded, setExpanded] = useState(null); // workout id
  const [detail, setDetail] = useState({}); // workoutId -> {workout, sets}
  const [exercises, setExercises] = useState([]); // selected member's exercises
  const [progExId, setProgExId] = useState("");
  const [progMetric, setProgMetric] = useState("top_weight");
  const [progPoints, setProgPoints] = useState(null);
  const [nutDays, setNutDays] = useState(null); // member's daily nutrition summary
  const [nutExpanded, setNutExpanded] = useState(null); // expanded date
  const [nutDetail, setNutDetail] = useState({}); // date -> entries
  const [nutExporting, setNutExporting] = useState(false);
  const [goals, setGoals] = useState({ calories: "", protein: "", carbs: "", fat: "" });
  const [savingGoals, setSavingGoals] = useState(false);
  const [error, setError] = useState("");

  const mealLabel = (k) =>
    ({ breakfast: tr.mealBreakfast, lunch: tr.mealLunch, dinner: tr.mealDinner, snack: tr.mealSnack }[k] || k);

  const fail = useCallback((err) => {
    if (err.unauthorized) return onAuthError();
    setError(err.message);
  }, [onAuthError]);

  useEffect(() => {
    apiAuth("/api/admin/members").then((d) => setMembers(d.members)).catch(fail);
  }, [fail]);

  const openMember = async (id) => {
    setExpanded(null);
    setProgExId("");
    setProgPoints(null);
    setNutDays(null);
    setNutExpanded(null);
    setNutDetail({});
    try {
      const d = await apiAuth(`/api/admin/members/${id}`);
      setSel(d);
      apiAuth(`/api/admin/members/${id}/exercises`).then((r) => setExercises(r.exercises)).catch(() => {});
      apiAuth(`/api/admin/members/${id}/nutrition`).then((r) => setNutDays(r.days)).catch(() => setNutDays([]));
      apiAuth(`/api/admin/members/${id}/nutrition-goals`)
        .then((r) => setGoals(r.goals ? { calories: r.goals.calories, protein: r.goals.protein, carbs: r.goals.carbs, fat: r.goals.fat } : { calories: "", protein: "", carbs: "", fat: "" }))
        .catch(() => {});
    } catch (err) { fail(err); }
  };

  const saveGoals = async () => {
    setSavingGoals(true);
    try {
      await apiAuth(`/api/admin/members/${sel.member.id}/nutrition-goals`, "PUT", goals);
    } catch (err) { fail(err); }
    finally { setSavingGoals(false); }
  };

  const toggleNutDay = async (date) => {
    if (nutExpanded === date) return setNutExpanded(null);
    setNutExpanded(date);
    if (!nutDetail[date]) {
      try {
        const d = await apiAuth(`/api/admin/members/${sel.member.id}/nutrition/${date}`);
        setNutDetail((m) => ({ ...m, [date]: d.entries }));
      } catch (err) { fail(err); }
    }
  };

  const exportNutrition = async () => {
    setNutExporting(true);
    try {
      const XLSX = await import("xlsx");
      const d = await apiAuth(`/api/admin/members/${sel.member.id}/nutrition-all`);
      const rows = d.rows.map((r) => ({
        Date: r.date, Meal: mealLabel(r.meal), Food: r.food_name, Serving: r.serving,
        Calories: Math.round(r.calories), Protein: Math.round(r.protein), Carbs: Math.round(r.carbs), Fat: Math.round(r.fat),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Nutrition");
      XLSX.writeFile(wb, `nutricion-${sel.member.name}.xlsx`);
    } catch (err) { fail(err); }
    finally { setNutExporting(false); }
  };

  // Load the chosen exercise's progress for the selected member.
  useEffect(() => {
    if (!sel || !progExId) { setProgPoints(null); return; }
    apiAuth(`/api/admin/members/${sel.member.id}/progress/${progExId}`)
      .then((r) => setProgPoints(r.points))
      .catch(fail);
  }, [sel, progExId, fail]);

  const refreshMember = () => sel && openMember(sel.member.id);

  const toggleWorkout = async (id) => {
    if (expanded === id) return setExpanded(null);
    setExpanded(id);
    if (!detail[id]) {
      try {
        const d = await apiAuth(`/api/admin/workouts/${id}`);
        setDetail((m) => ({ ...m, [id]: d }));
      } catch (err) { fail(err); }
    }
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm(tr.confirmDelete)) return;
    try {
      await apiAuth(`/api/admin/workouts/${id}`, "DELETE");
      setExpanded(null);
      refreshMember();
    } catch (err) { fail(err); }
  };

  const activatePlan = async (id) => {
    try { await apiAuth(`/api/admin/plans/${id}/activate`, "POST"); refreshMember(); } catch (err) { fail(err); }
  };
  const deletePlan = async (id) => {
    if (!window.confirm(tr.confirmDelete)) return;
    try { await apiAuth(`/api/admin/plans/${id}`, "DELETE"); refreshMember(); } catch (err) { fail(err); }
  };
  const duplicatePlan = async (id, targetId, targetName) => {
    if (!targetId) return;
    try {
      await apiAuth(`/api/admin/plans/${id}/duplicate`, "POST", { targetMemberId: targetId });
      window.alert(`${t.admin.duplicatedTo} ${targetName}`);
    } catch (err) { fail(err); }
  };

  const A = t.admin;

  if (members === null) return <p className="text-warm-gray">{A.loading}</p>;

  // ── Member detail view ──
  if (sel) {
    const unitOf = (wid) => detail[wid]?.workout?.weight_unit || "kg";
    const inputCls = "px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none cursor-pointer focus:border-terracotta-light focus:bg-white";
    const chartPts = (progPoints || []).map((p) => ({ label: formatDate(p.date, lang), value: Math.round(Number(p[progMetric]) || 0) }));
    const recentNut = (nutDays || []).slice(0, 7);
    const nutAvg = recentNut.length
      ? {
          calories: recentNut.reduce((s, d) => s + Number(d.calories), 0) / recentNut.length,
          protein: recentNut.reduce((s, d) => s + Number(d.protein), 0) / recentNut.length,
          carbs: recentNut.reduce((s, d) => s + Number(d.carbs), 0) / recentNut.length,
          fat: recentNut.reduce((s, d) => s + Number(d.fat), 0) / recentNut.length,
        }
      : null;
    return (
      <div>
        <button onClick={() => setSel(null)} className="text-terracotta text-[0.85rem] font-semibold mb-4 hover:text-terracotta-dark">
          ← {A.backToMembers}
        </button>
        <h1 className="font-display text-[1.7rem] font-semibold text-charcoal">{sel.member.name}</h1>
        <p className="text-[0.85rem] text-warm-gray mb-6">{sel.member.email}</p>
        {error && <p className="text-[0.85rem] text-red-500 mb-4">{error}</p>}

        {/* Plans */}
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mb-3">{A.plans}</h2>
        <div className="grid gap-2 mb-8">
          {sel.plans.length === 0 ? (
            <p className="text-warm-gray text-[0.88rem]">{A.noPlans}</p>
          ) : sel.plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-sand p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-charcoal text-[0.92rem] truncate">{p.name}</span>
                  {p.is_active && <span className="text-[0.66rem] font-semibold px-2 py-0.5 rounded-full bg-sage-light text-forest">{A.active}</span>}
                </div>
                <div className="text-[0.76rem] text-warm-gray mt-0.5">{p.week_count} {tr.weekCountLabel}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/admin/members/${sel.member.id}/plans/${p.id}`} className="text-[0.8rem] font-semibold text-forest border border-sage-light px-3 py-1.5 rounded-full hover:bg-sage-light/40">{A.edit}</Link>
                {!p.is_active && <button onClick={() => activatePlan(p.id)} className="text-[0.8rem] font-semibold text-warm-gray border border-sand px-3 py-1.5 rounded-full hover:bg-sand">{A.activate}</button>}
                {members.filter((m) => m.id !== sel.member.id).length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const m = members.find((x) => x.id === e.target.value);
                      if (m) duplicatePlan(p.id, m.id, m.name);
                      e.target.value = "";
                    }}
                    className="text-[0.8rem] font-semibold text-forest border border-sage-light px-2 py-1.5 rounded-full bg-white cursor-pointer max-w-[150px]"
                    title={A.duplicateTo}
                  >
                    <option value="">⧉ {A.duplicateTo}</option>
                    {members.filter((m) => m.id !== sel.member.id).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => deletePlan(p.id)} className="text-[0.8rem] font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50">{A.delete}</button>
              </div>
            </div>
          ))}
          <Link to={`/admin/members/${sel.member.id}/plans/new`} className="text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark mt-1">+ {A.newPlan}</Link>
        </div>

        {/* Workouts */}
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mb-3">{A.workouts}</h2>
        {sel.workouts.length === 0 ? (
          <p className="text-warm-gray text-[0.88rem]">{A.noWorkouts}</p>
        ) : (
          <div className="grid gap-3">
            {sel.workouts.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl border border-sand overflow-hidden">
                <button onClick={() => toggleWorkout(w.id)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-cream/50">
                  <div>
                    <h3 className="font-semibold text-charcoal text-[0.95rem]">{w.title}</h3>
                    <div className="text-[0.78rem] text-warm-gray mt-1">{formatDate(w.performed_at, lang)} · {w.exercise_count} {tr.exercises} · {w.set_count} {tr.sets}</div>
                  </div>
                  <span className="text-terracotta text-xs">{expanded === w.id ? "▲" : "▼"}</span>
                </button>
                {expanded === w.id && detail[w.id] && (
                  <div className="px-4 pb-5 border-t border-sand pt-4">
                    {detail[w.id].workout.notes && <p className="text-[0.82rem] text-warm-gray italic mb-3">"{detail[w.id].workout.notes}"</p>}
                    <SessionFeedback workout={detail[w.id].workout} tr={tr} />
                    <div className="divide-y divide-sand/60">
                      {groupByExercise(detail[w.id].sets).map((g, gi) => (
                        <div key={gi} className="flex items-baseline justify-between gap-3 py-2">
                          <span className="text-[0.88rem] font-medium text-charcoal">{g.name}</span>
                          <span className="text-[0.78rem] text-warm-gray text-right shrink-0">
                            {g.sets.map((s) => `${s.weight || 0}${s.weight_unit || unitOf(w.id)}×${s.reps || 0}${s.rir ? ` (${s.rir})` : ""}`).join(" · ")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => deleteWorkout(w.id)} className="text-[0.8rem] font-semibold text-red-500 hover:text-red-600 mt-3">{A.deleteWorkout}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mt-8 mb-3">{tr.progress}</h2>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <div className="flex flex-wrap gap-3 mb-5">
            <select value={progExId} onChange={(e) => setProgExId(e.target.value)} className={inputCls}>
              <option value="">{tr.selectExercise}</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            {progExId && (
              <select value={progMetric} onChange={(e) => setProgMetric(e.target.value)} className={inputCls}>
                <option value="top_weight">{tr.mTopWeight}</option>
                <option value="est_1rm">{tr.m1rm}</option>
                <option value="volume">{tr.mVolume}</option>
              </select>
            )}
          </div>
          {!progExId ? (
            <p className="text-warm-gray text-center py-10">{tr.pickToSeeProgress}</p>
          ) : progPoints === null ? (
            <p className="text-warm-gray text-center py-10">{tr.loading}</p>
          ) : chartPts.length === 0 ? (
            <p className="text-warm-gray text-center py-10">{tr.noProgressData}</p>
          ) : (
            <LineChart points={chartPts} />
          )}
        </div>

        {/* Nutrition summary (daily totals) */}
        <div className="flex items-center justify-between gap-3 mt-8 mb-3">
          <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray">{tr.nutLink}</h2>
          {nutDays && nutDays.length > 0 && (
            <button onClick={exportNutrition} disabled={nutExporting} className="text-[0.8rem] font-semibold text-forest border border-sage-light px-3 py-1.5 rounded-full hover:bg-sage-light/40 disabled:opacity-60">
              {nutExporting ? tr.exporting : `📥 ${tr.exportExcel}`}
            </button>
          )}
        </div>

        {/* Daily goals editor (coach sets them) */}
        <div className="bg-white rounded-2xl border border-sand p-5 mb-3">
          <div className="text-[0.78rem] font-semibold text-charcoal mb-2">🎯 {tr.nutGoalsTitle}</div>
          <div className="flex flex-wrap items-end gap-3">
            {[["calories", tr.nutCalories], ["protein", tr.nutProtein], ["carbs", tr.nutCarbs], ["fat", tr.nutFat]].map(([k, label]) => (
              <div key={k}>
                <label className="block text-[0.7rem] uppercase tracking-[0.06em] text-warm-gray mb-1">{label}</label>
                <input type="number" min="0" value={goals[k]} onChange={(e) => setGoals((g) => ({ ...g, [k]: e.target.value }))} className="w-[90px] px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] bg-cream outline-none focus:border-terracotta-light focus:bg-white" />
              </div>
            ))}
            <button onClick={saveGoals} disabled={savingGoals} className="text-[0.82rem] font-semibold text-white bg-terracotta px-4 py-2 rounded-full hover:bg-terracotta-dark disabled:opacity-60">
              {savingGoals ? tr.saving : tr.nutSaveGoals}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sand p-5">
          {nutDays === null ? (
            <p className="text-warm-gray text-center py-8">{tr.loading}</p>
          ) : nutDays.length === 0 ? (
            <p className="text-warm-gray text-center py-8">{tr.nutNoEntries}</p>
          ) : (
            <>
              {nutAvg && (
                <div className="mb-4">
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-warm-gray mb-2">{tr.nutAvg7}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-cream rounded-xl p-3 text-center">
                    <div><div className="font-display text-[1.3rem] font-semibold text-charcoal">{Math.round(nutAvg.calories)}</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutCalories}</div></div>
                    <div><div className="font-display text-[1.3rem] font-semibold text-charcoal">{Math.round(nutAvg.protein)}g</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutProtein}</div></div>
                    <div><div className="font-display text-[1.3rem] font-semibold text-charcoal">{Math.round(nutAvg.carbs)}g</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutCarbs}</div></div>
                    <div><div className="font-display text-[1.3rem] font-semibold text-charcoal">{Math.round(nutAvg.fat)}g</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutFat}</div></div>
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                {nutDays.map((d) => (
                <div key={d.date} className="border border-sand rounded-xl overflow-hidden">
                  <button onClick={() => toggleNutDay(d.date)} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-cream/50">
                    <span className="text-[0.86rem] font-medium text-charcoal">{formatDate(d.date, lang)}</span>
                    <span className="text-[0.78rem] text-warm-gray text-right shrink-0">
                      <span className="font-semibold text-charcoal">{Math.round(d.calories)}</span> kcal · P{Math.round(d.protein)} C{Math.round(d.carbs)} G{Math.round(d.fat)}
                      <span className="text-terracotta ml-2 text-xs">{nutExpanded === d.date ? "▲" : "▼"}</span>
                    </span>
                  </button>
                  {nutExpanded === d.date && nutDetail[d.date] && (
                    <div className="px-3 pb-3 border-t border-sand pt-2">
                      {nutDetail[d.date].length === 0 ? (
                        <p className="text-[0.8rem] text-warm-gray py-2">{tr.nutNoEntries}</p>
                      ) : (
                        [...new Set(nutDetail[d.date].map((e) => e.meal))].map((meal) => (
                          <div key={meal} className="py-1.5">
                            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-warm-gray mb-1 capitalize">{mealLabel(meal)}</div>
                            {nutDetail[d.date].filter((e) => e.meal === meal).map((e) => (
                              <div key={e.id} className="flex items-baseline justify-between gap-3 text-[0.82rem] py-0.5">
                                <span className="text-charcoal min-w-0 truncate">{e.food_name}{e.serving ? <span className="text-warm-gray"> · {e.serving}</span> : null}</span>
                                <span className="text-warm-gray shrink-0">{Math.round(e.calories)} kcal · P{Math.round(e.protein)} C{Math.round(e.carbs)} G{Math.round(e.fat)}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Members list ──
  return (
    <div>
      <h1 className="font-display text-[2rem] font-semibold text-charcoal mb-6">{A.members}</h1>
      {error && <p className="text-[0.85rem] text-red-500 mb-4">{error}</p>}
      {members.length === 0 ? (
        <p className="text-warm-gray py-8">{A.noMembers}</p>
      ) : (
        <div className="grid gap-2">
          {members.map((m) => (
            <button key={m.id} onClick={() => openMember(m.id)} className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-sand p-4 text-left hover:bg-cream/50 transition-colors">
              <div className="min-w-0">
                <div className="font-semibold text-charcoal text-[0.95rem] truncate">{m.name}</div>
                <div className="text-[0.76rem] text-warm-gray truncate">{m.email}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[0.82rem] font-semibold text-forest">{m.workout_count} {A.workoutsShort}</div>
                <div className="text-[0.72rem] text-warm-gray">{m.last_workout ? formatDate(m.last_workout, lang) : A.never}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
