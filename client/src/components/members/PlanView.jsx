import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import PlanWeeks from "./PlanWeeks";

export default function PlanView() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(undefined);
  const [exMap, setExMap] = useState({});
  const [doneMap, setDoneMap] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, ex, w] = await Promise.all([
        userApi(`/api/plans/${id}`),
        userApi("/api/exercises"),
        userApi("/api/workouts"),
      ]);
      setPlan(p.plan);
      const map = {};
      ex.exercises.forEach((e) => (map[e.id] = e));
      setExMap(map);
      const m = {};
      (w.workouts || []).forEach((x) => { if (!m[x.title]) m[x.title] = { id: x.id, date: x.performed_at }; });
      setDoneMap(m);
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
      setPlan(null);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!getUserToken()) return navigate("/login");
    load();
  }, [load, navigate]);

  const wrap = (child) => (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[820px] mx-auto px-[5%] py-10">{child}</main>
    </div>
  );

  if (plan === undefined) return wrap(<p className="text-warm-gray">{tr.loading}</p>);
  if (!plan) return wrap(<p className="text-warm-gray">{error || tr.noPlans}</p>);

  const weeks = plan.weeks || [];
  const dayDone = (week, day) => Boolean(doneMap[`${week.name} · ${day.name}`]);
  const totalDays = weeks.reduce((n, w) => n + (w.days || []).length, 0);
  const doneDays = weeks.reduce((n, w) => n + (w.days || []).filter((d) => dayDone(w, d)).length, 0);
  const overallPct = totalDays ? (doneDays / totalDays) * 100 : 0;
  let currentWeekIdx = weeks.findIndex((w) => (w.days || []).some((d) => !dayDone(w, d)));
  if (currentWeekIdx < 0) currentWeekIdx = 0;

  return wrap(
    <>
      <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
        {tr.back}
      </button>

      <div className="bg-forest text-white rounded-2xl p-5 sm:p-6 mb-6">
        <div className="font-display text-[1.6rem] font-semibold">{plan.name}</div>
        {plan.objective && <div className="text-[0.85rem] text-sage-light mt-0.5">{plan.objective}</div>}
        {plan.endDate && (
          <div className="text-[0.72rem] uppercase tracking-[0.1em] text-white/60 mt-2">
            {tr.planExpires}: <span className="text-gold">{formatDate(plan.endDate, lang)}</span>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-gold rounded-full" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-[0.85rem] font-semibold shrink-0">{Math.round(overallPct)}%</span>
        </div>
      </div>

      <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mb-3">{tr.weeksLabel}</h2>
      <PlanWeeks plan={plan} exMap={exMap} doneMap={doneMap} currentWeekIdx={currentWeekIdx} />
    </>
  );
}
