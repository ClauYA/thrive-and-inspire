import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import Calendar from "./Calendar";
import WeekStrip from "./WeekStrip";
import DayPicker from "./DayPicker";
import SessionFeedback from "./SessionFeedback";
import ProgressRing from "./ProgressRing";
import { Button } from "../ui";

const localKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState(null);
  const [plan, setPlan] = useState(undefined); // undefined = loading
  const [exMap, setExMap] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [view, setView] = useState("list");
  const [pickerDate, setPickerDate] = useState(null); // "YYYY-MM-DD" tapped in calendar/strip
  const [nutToday, setNutToday] = useState(null); // today's calories/macros (best-effort)
  const [nutGoals, setNutGoals] = useState(null); // coach-set macro goals (best-effort)
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [w, p, ex] = await Promise.all([userApi("/api/workouts"), userApi("/api/plans/active"), userApi("/api/exercises")]);
      setWorkouts(w.workouts);
      setPlan(p.plan);
      const map = {};
      ex.exercises.forEach((e) => (map[e.id] = e.name));
      setExMap(map);
      // Today's nutrition summary — best-effort (skips quietly if not set up).
      userApi(`/api/nutrition/log?date=${localKey(new Date().toISOString())}`)
        .then((d) => setNutToday(d.totals))
        .catch(() => {});
      userApi("/api/nutrition/goals").then((d) => setNutGoals(d.goals)).catch(() => {});
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
      setWorkouts([]);
      setPlan(null);
    }
  }, [navigate]);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    load();
  }, [load, navigate]);

  const openDetail = async (id) => {
    if (!detail[id]) {
      try {
        const d = await userApi(`/api/workouts/${id}`);
        setDetail((prev) => ({ ...prev, [id]: d }));
      } catch (e) {
        if (e.unauthorized) navigate("/login");
      }
    }
  };

  const toggle = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    openDetail(id);
  };

  const deleteWorkout = async (id) => {
    if (!window.confirm(tr.confirmDelete)) return;
    try {
      await userApi(`/api/workouts/${id}`, "DELETE");
      setExpanded(null);
      load();
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    }
  };

  const pickFromCalendar = async (id) => {
    setView("list");
    setExpanded(id);
    openDetail(id);
  };

  const weekList = plan && plan.weeks ? plan.weeks : [];
  // Up next is derived from history (self-correcting), not a stored pointer:
  // walk the plan in order and pick the day right after the last one logged.
  const planOrder = [];
  weekList.forEach((w, wi) => (w.days || []).forEach((d, di) => planOrder.push({ wi, di, key: `${w.name} · ${d.name}` })));
  const doneTitles = new Set((workouts || []).map((w) => w.title));
  let lastDone = -1;
  planOrder.forEach((p, i) => { if (doneTitles.has(p.key)) lastDone = i; });
  const nextPos = planOrder[lastDone + 1] || planOrder[0] || null;
  const curWeekIdx = nextPos ? nextPos.wi : 0;
  const curDayIdx = nextPos ? nextPos.di : 0;
  const curWeek = nextPos ? weekList[curWeekIdx] : null;
  const nextDay = curWeek ? curWeek.days[curDayIdx] : null;
  // Shape the current week for the WeekStrip (expects { nextIndex, days:[{name, exerciseIds}] }).
  const weekForStrip = curWeek
    ? { nextIndex: curDayIdx, days: curWeek.days.map((d) => ({ name: d.name, exerciseIds: (d.exercises || []).map((e) => e.exerciseId).filter(Boolean) })) }
    : null;

  // Shared day-picker (calendar + This Week strip): only the days of the week
  // you're currently on (not the whole plan), plus the workouts logged that day.
  const planDays = [];
  (curWeek?.days || []).forEach((d, di) =>
    planDays.push({ wi: curWeekIdx, di, week: curWeek.name, day: d.name, count: (d.exercises || []).length })
  );
  const pickerWorkouts = pickerDate ? (workouts || []).filter((w) => localKey(w.performed_at) === pickerDate) : [];
  const startPlanned = (wi, di, dateKey) => navigate(`/app/new?plan=${plan.id}&week=${wi}&day=${di}&date=${dateKey}`);
  const startBlank = (dateKey) => navigate(`/app/new?date=${dateKey}`);

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[820px] mx-auto px-[5%] py-10">
        <h1 className="font-display text-[2rem] font-semibold text-charcoal mb-6">{tr.appTitle}</h1>

        {/* Up next / active plan card */}
        {plan !== undefined && (
          <div className="bg-forest text-white rounded-2xl p-5 sm:p-6 mb-6">
            {nextDay ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[0.72rem] uppercase tracking-[0.12em] text-sage-light mb-1">{tr.upNext} · {plan.name} · {curWeek.name}</div>
                  <div className="font-display text-[1.5rem] font-semibold">{nextDay.name}</div>
                  <div className="text-[0.8rem] text-white/60 mt-0.5">{(nextDay.exercises || []).length} {tr.exercises}</div>
                </div>
                <div className="flex gap-2">
                  <Button as={Link} to={`/app/new?plan=${plan.id}&week=${curWeekIdx}&day=${curDayIdx}`} size="sm">
                    {tr.startDay}
                  </Button>
                  <Button as={Link} to={`/app/plans/${plan.id}`} variant="outlineLight" size="sm">
                    {tr.editPlanBtn}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-display text-[1.3rem] font-semibold">{tr.noPlanTitle}</div>
                  <div className="text-[0.82rem] text-white/60 mt-0.5">{tr.noPlanSub}</div>
                </div>
                <Button as={Link} to="/app/plans" size="sm">
                  {tr.createPlan}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* This week strip */}
        {workouts !== null && weekForStrip && weekForStrip.days.length > 0 && (
          <WeekStrip workouts={workouts} routine={weekForStrip} planName={plan?.name} weekName={curWeek?.name} onOpenDay={setPickerDate} />
        )}

        {/* Today's nutrition summary */}
        {nutToday && (
          <Link to="/app/nutrition" className="block bg-white border border-sand rounded-2xl p-4 sm:p-5 mb-6 hover:border-terracotta transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray">{tr.nutSummaryTitle}</span>
              <span className="text-[0.8rem] font-semibold text-terracotta">{tr.nutLogFood} →</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="text-center">
                <div className="font-display text-[1.4rem] font-semibold text-charcoal">{Math.round(nutToday.calories)}</div>
                <div className="text-[0.66rem] uppercase tracking-[0.08em] text-warm-gray">{tr.nutCalories}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-[1.4rem] font-semibold text-charcoal">{Math.round(nutToday.protein)}{nutGoals?.protein ? <span className="text-[0.8rem] text-warm-gray">/{Math.round(nutGoals.protein)}</span> : null}g</div>
                <div className="text-[0.66rem] uppercase tracking-[0.08em] text-warm-gray">{tr.nutProtein}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-[1.4rem] font-semibold text-charcoal">{Math.round(nutToday.carbs)}{nutGoals?.carbs ? <span className="text-[0.8rem] text-warm-gray">/{Math.round(nutGoals.carbs)}</span> : null}g</div>
                <div className="text-[0.66rem] uppercase tracking-[0.08em] text-warm-gray">{tr.nutCarbs}</div>
              </div>
              <div className="text-center">
                <div className="font-display text-[1.4rem] font-semibold text-charcoal">{Math.round(nutToday.fat)}{nutGoals?.fat ? <span className="text-[0.8rem] text-warm-gray">/{Math.round(nutGoals.fat)}</span> : null}g</div>
                <div className="text-[0.66rem] uppercase tracking-[0.08em] text-warm-gray">{tr.nutFat}</div>
              </div>
            </div>

            {/* Mini macro-goal rings */}
            {nutGoals && (Number(nutGoals.protein) > 0 || Number(nutGoals.carbs) > 0 || Number(nutGoals.fat) > 0) && (
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-sand">
                {[
                  { key: "protein", label: tr.nutProtein, color: "#b07d1f" },
                  { key: "carbs", label: tr.nutCarbs, color: "#3d5a3d" },
                  { key: "fat", label: tr.nutFat, color: "#c47a54" },
                ].map((m) => {
                  const goal = Number(nutGoals[m.key]) || 0;
                  const val = Number(nutToday[m.key]) || 0;
                  return <ProgressRing key={m.key} pct={goal > 0 ? (val / goal) * 100 : 0} label={m.label} color={m.color} size={54} />;
                })}
              </div>
            )}
          </Link>
        )}

        {/* Toolbar: new workout + view toggle */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex bg-white border border-sand rounded-full p-1">
            <button onClick={() => setView("list")} className={`text-[0.82rem] font-semibold px-4 py-1.5 rounded-full transition-colors ${view === "list" ? "bg-terracotta text-white" : "text-warm-gray"}`}>
              {tr.viewList}
            </button>
            <button onClick={() => setView("calendar")} className={`text-[0.82rem] font-semibold px-4 py-1.5 rounded-full transition-colors ${view === "calendar" ? "bg-terracotta text-white" : "text-warm-gray"}`}>
              {tr.viewCalendar}
            </button>
          </div>
          <Button as={Link} to="/app/new" size="sm" className="whitespace-nowrap">
            + {tr.newWorkout}
          </Button>
        </div>

        {error && <p className="text-red-500 text-[0.85rem] mb-4">{error}</p>}

        {workouts === null ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : view === "calendar" ? (
          <Calendar workouts={workouts} onOpenDay={setPickerDate} />
        ) : workouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏋️</div>
            <p className="text-warm-gray mb-6">{tr.noWorkouts}</p>
            <Button as={Link} to="/app/new">
              + {tr.newWorkout}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {workouts.map((w) => (
              <div key={w.id} className="bg-white rounded-2xl border border-sand overflow-hidden">
                <button onClick={() => toggle(w.id)} className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-cream/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-charcoal text-[0.95rem]">{w.title}</h3>
                    <div className="text-[0.78rem] text-warm-gray mt-1">
                      {formatDate(w.performed_at, lang)} · {w.exercise_count} {tr.exercises} · {w.set_count} {tr.sets}
                    </div>
                  </div>
                  <span className="text-terracotta text-xs">{expanded === w.id ? "▲" : "▼"}</span>
                </button>

                {expanded === w.id && detail[w.id] && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-sand pt-4">
                    {detail[w.id].workout.notes && <p className="text-[0.82rem] text-warm-gray italic mb-4">"{detail[w.id].workout.notes}"</p>}
                    <SessionFeedback workout={detail[w.id].workout} tr={tr} />
                    <div className="divide-y divide-sand/60">
                      {groupByExercise(detail[w.id].sets).map((g, gi) => (
                        <div key={gi} className="flex items-baseline justify-between gap-3 py-2">
                          <span className="text-[0.88rem] font-medium text-charcoal">{g.name}</span>
                          <span className="text-[0.78rem] text-warm-gray text-right shrink-0">
                            {g.sets.map((s) => `${s.weight || 0}${s.weight_unit || detail[w.id].workout.weight_unit || "kg"}×${s.reps || 0}${s.rir ? ` (${s.rir})` : ""}`).join(" · ")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => navigate(`/app/new?edit=${w.id}`)} className="text-[0.82rem] font-semibold text-forest border border-sage-light px-3 py-1.5 rounded-full hover:bg-sage-light/40">
                        ✏️ {tr.edit}
                      </button>
                      <button onClick={() => deleteWorkout(w.id)} className="text-[0.82rem] font-semibold text-red-500 hover:text-red-600">
                        {tr.delete}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pickerDate && (
          <DayPicker
            dateKey={pickerDate}
            dayWorkouts={pickerWorkouts}
            planDays={planDays}
            onPick={pickFromCalendar}
            onStartPlanned={startPlanned}
            onStartBlank={startBlank}
            onClose={() => setPickerDate(null)}
          />
        )}
      </main>
    </div>
  );
}
