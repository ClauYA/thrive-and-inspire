import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import ProgressRing from "./ProgressRing";

// A small horizontal progress bar.
function Bar({ pct }) {
  return (
    <div className="h-1.5 rounded-full bg-sand overflow-hidden">
      <div className="h-full bg-terracotta rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

function videoUrl(ex) {
  if (ex?.media_url) return ex.media_url;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent("how to " + (ex?.name || ""))}`;
}

export default function PlanView() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(undefined); // undefined = loading
  const [exMap, setExMap] = useState({});
  const [doneTitles, setDoneTitles] = useState(new Set());
  const [openWeek, setOpenWeek] = useState(0);
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
      setDoneTitles(new Set((w.workouts || []).map((x) => x.title)));
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

  const dayDone = (week, day) => doneTitles.has(`${week.name} · ${day.name}`);
  const weekPct = (week) => {
    const days = week.days || [];
    if (!days.length) return 0;
    return (days.filter((d) => dayDone(week, d)).length / days.length) * 100;
  };

  if (plan === undefined) {
    return (
      <div className="min-h-screen bg-cream relative z-[1]"><MemberHeader /><main className="max-w-[820px] mx-auto px-[5%] py-10"><p className="text-warm-gray">{tr.loading}</p></main></div>
    );
  }
  if (!plan) {
    return (
      <div className="min-h-screen bg-cream relative z-[1]"><MemberHeader /><main className="max-w-[820px] mx-auto px-[5%] py-10"><p className="text-warm-gray">{error || tr.noPlans}</p></main></div>
    );
  }

  const weeks = plan.weeks || [];
  const totalDays = weeks.reduce((n, w) => n + (w.days || []).length, 0);
  const doneDays = weeks.reduce((n, w) => n + (w.days || []).filter((d) => dayDone(w, d)).length, 0);
  const overallPct = totalDays ? (doneDays / totalDays) * 100 : 0;

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[820px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>

        {/* Mesocycle header */}
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

        {error && <p className="text-red-500 text-[0.85rem] mb-4">{error}</p>}

        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mb-3">{tr.weeksLabel}</h2>

        <div className="grid gap-3">
          {weeks.map((week, wi) => {
            const pct = weekPct(week);
            const open = openWeek === wi;
            return (
              <div key={wi} className="bg-white rounded-2xl border border-sand overflow-hidden">
                <button onClick={() => setOpenWeek(open ? -1 : wi)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-cream/50">
                  <div className="min-w-0">
                    <div className="font-semibold text-charcoal">{week.name}</div>
                    <div className="text-[0.76rem] text-warm-gray">{(week.days || []).length} {tr.daysLabel}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ProgressRing pct={pct} size={48} color={pct >= 100 ? "#7aa06f" : "#b07d1f"} />
                    <span className="text-terracotta text-xs">{open ? "▲" : "▼"}</span>
                  </div>
                </button>

                {open && (
                  <div className="px-4 pb-4 border-t border-sand pt-3 grid gap-3">
                    {(week.days || []).map((day, di) => {
                      const done = dayDone(week, day);
                      const exs = day.exercises || [];
                      // Sets summed per muscle group for the "you work in this routine" chips.
                      const byGroup = {};
                      let totalSets = 0;
                      exs.forEach((e) => {
                        const g = exMap[e.exerciseId]?.muscle_group;
                        const s = Number(e.sets) || 0;
                        totalSets += s;
                        if (g) byGroup[g] = (byGroup[g] || 0) + s;
                      });
                      const chips = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
                      return (
                        <div key={di} className="border border-sand rounded-xl p-3 sm:p-4 bg-cream/30">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-charcoal">{day.name}</span>
                            <span className="text-[0.72rem] text-warm-gray">{done ? "✓ 100%" : "0%"}</span>
                          </div>
                          <Bar pct={done ? 100 : 0} />

                          <div className="grid gap-1.5 mt-3">
                            {exs.map((e, ei) => {
                              const ex = exMap[e.exerciseId];
                              return (
                                <div key={ei} className="flex items-center justify-between gap-2">
                                  <span className="text-[0.86rem] text-charcoal min-w-0 truncate">{ex?.name || tr.selectExercise}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[0.68rem] font-semibold text-forest bg-sage-light/40 px-2 py-0.5 rounded-full whitespace-nowrap">{e.sets || 0} {tr.seriesShort}</span>
                                    <a href={videoUrl(ex)} target="_blank" rel="noopener noreferrer" aria-label={tr.watchVideo} className="text-forest hover:text-terracotta">👁️</a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {chips.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[0.72rem] text-warm-gray mb-1.5">{tr.worksOnLabel}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {chips.map(([g, n]) => (
                                  <span key={g} className="text-[0.72rem] font-medium text-charcoal bg-white border border-sand px-2.5 py-1 rounded-full capitalize">
                                    <span className="text-terracotta font-semibold">{n}</span> {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <Link
                            to={`/app/new?plan=${plan.id}&week=${wi}&day=${di}`}
                            className="mt-4 block text-center bg-terracotta text-white font-semibold py-3 rounded-full hover:bg-terracotta-dark transition-colors"
                          >
                            {tr.startBtn}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
