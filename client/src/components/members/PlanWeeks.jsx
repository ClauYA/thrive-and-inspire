import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import ProgressRing from "./ProgressRing";

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

// Weeks accordion + day cards for a plan. Reused by PlanView and the dashboard.
export default function PlanWeeks({ plan, exMap, doneTitles, currentWeekIdx = 0 }) {
  const { t } = useLanguage();
  const tr = t.tracker;
  const [openWeek, setOpenWeek] = useState(currentWeekIdx);

  const weeks = plan.weeks || [];
  const dayDone = (week, day) => doneTitles.has(`${week.name} · ${day.name}`);
  const weekPct = (week) => {
    const days = week.days || [];
    if (!days.length) return 0;
    return (days.filter((d) => dayDone(week, d)).length / days.length) * 100;
  };

  // Show the current week first, then the rest in order.
  const order = weeks.map((_, i) => i).sort((a, b) => (a === currentWeekIdx ? -1 : b === currentWeekIdx ? 1 : a - b));

  return (
    <div className="grid gap-3">
      {order.map((wi) => {
        const week = weeks[wi];
        const pct = weekPct(week);
        const open = openWeek === wi;
        return (
          <div key={wi} className="min-w-0 bg-white rounded-2xl border border-sand overflow-hidden">
            <button onClick={() => setOpenWeek(open ? -1 : wi)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-cream/50">
              <div className="min-w-0">
                <div className="font-semibold text-charcoal truncate">{week.name}{wi === currentWeekIdx ? ` · ${tr.upNext}` : ""}</div>
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
                  const byGroup = {};
                  exs.forEach((e) => {
                    const g = exMap[e.exerciseId]?.muscle_group;
                    const s = Number(e.sets) || 0;
                    if (g) byGroup[g] = (byGroup[g] || 0) + s;
                  });
                  const chips = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
                  return (
                    <div key={di} className="min-w-0 border border-sand rounded-xl p-3 sm:p-4 bg-cream/30">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-charcoal truncate">{day.name}</span>
                        <span className="text-[0.72rem] text-warm-gray shrink-0">{done ? "✓ 100%" : "0%"}</span>
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
  );
}
