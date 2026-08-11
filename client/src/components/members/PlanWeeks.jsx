import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import ProgressRing from "./ProgressRing";
import VideoModal from "./VideoModal";
import CardioModal from "./CardioModal";
import { equipmentChips } from "../../lib/equipment";

function Bar({ pct }) {
  return (
    <div className="h-1.5 rounded-full bg-sand overflow-hidden">
      <div className="h-full bg-terracotta rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

// Weeks accordion + day cards for a plan. Reused by PlanView and the dashboard.
export default function PlanWeeks({ plan, exMap, doneMap = {}, currentWeekIdx = 0, readOnly = false, onCardioSaved }) {
  const { t } = useLanguage();
  const tr = t.tracker;
  const [openWeek, setOpenWeek] = useState(currentWeekIdx);
  const [video, setVideo] = useState(null); // { name, url } of the exercise demo to play, or null
  const [cardioDay, setCardioDay] = useState(null); // the plan day whose cardio is being logged, or null

  const weeks = plan.weeks || [];
  const dayWorkout = (week, day) => doneMap[`${week.name} · ${day.name}`];
  const dayDone = (week, day) => Boolean(dayWorkout(week, day));
  const weekPct = (week) => {
    const days = week.days || [];
    if (!days.length) return 0;
    return (days.filter((d) => dayDone(week, d)).length / days.length) * 100;
  };

  // Show the current week first, then the rest in order.
  const order = weeks.map((_, i) => i).sort((a, b) => (a === currentWeekIdx ? -1 : b === currentWeekIdx ? 1 : a - b));

  return (
    <>
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
                {(week.days || [])
                  .map((day, di) => ({ day, di }))
                  .sort((a, b) => {
                    const da = dayDone(week, a.day);
                    const db = dayDone(week, b.day);
                    if (da !== db) return da ? 1 : -1; // pending days first
                    if (da && db) return new Date(dayWorkout(week, a.day).date) - new Date(dayWorkout(week, b.day).date);
                    return a.di - b.di; // both pending: keep plan order
                  })
                  .map(({ day, di }) => {
                  const done = dayDone(week, day);
                  const exs = day.exercises || [];
                  const byGroup = {};
                  exs.forEach((e) => {
                    const g = exMap[e.exerciseId]?.muscle_group;
                    const s = Number(e.sets) || 0;
                    if (g) byGroup[g] = (byGroup[g] || 0) + s;
                  });
                  const chips = Object.entries(byGroup).sort((a, b) => b[1] - a[1]);
                  const equip = equipmentChips(exs.map((e) => exMap[e.exerciseId]));
                  return (
                    <div key={di} className="min-w-0 border border-sand rounded-xl p-3 sm:p-4 bg-cream/30">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-charcoal truncate">{day.name}</span>
                        <span className="text-[0.72rem] text-warm-gray shrink-0">{done ? "✓ 100%" : "0%"}</span>
                      </div>
                      <Bar pct={done ? 100 : 0} />
                      {day.notes && <div className="mt-2 text-[0.76rem] text-warm-gray italic whitespace-pre-line">{day.notes}</div>}
                      {day.cardio && (
                        <div className="mt-2 flex items-start gap-2 bg-sage-light/25 border border-sage-light rounded-xl px-3 py-2">
                          <span className="shrink-0">🏃</span>
                          <div className="min-w-0">
                            <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-forest">{tr.cardioLabel}</div>
                            <div className="text-[0.8rem] text-charcoal whitespace-pre-line">{day.cardio}</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-1.5">
                        {exs.map((e, ei) => {
                          const ex = exMap[e.exerciseId];
                          return (
                            <div key={ei} className="flex items-start justify-between gap-2 min-w-0">
                              <div className="min-w-0">
                                <span className="block text-[0.86rem] text-charcoal truncate">{ex?.name || tr.selectExercise}</span>
                                {e.notes && <span className="block text-[0.72rem] text-warm-gray">{e.notes}</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[0.68rem] font-semibold text-forest bg-sage-light/40 px-2 py-0.5 rounded-full whitespace-nowrap">{e.sets || 0} {tr.seriesShort}</span>
                                <button type="button" onClick={() => setVideo({ name: ex?.name, url: ex?.media_url, gifId: ex?.gif_id })} aria-label={tr.watchVideo} className="text-forest hover:text-terracotta">👁️</button>
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

                      {equip.length > 0 && (
                        <div className="mt-2.5">
                          <div className="text-[0.72rem] text-warm-gray mb-1.5">{tr.equipmentNeed}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {equip.map((eq) => (
                              <span key={eq.label} className="text-[0.72rem] font-medium text-forest bg-sage-light/30 border border-sage-light px-2.5 py-1 rounded-full whitespace-nowrap">
                                {eq.icon} {eq.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setCardioDay(day)}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 text-[0.82rem] font-semibold text-forest border border-sage-light bg-white rounded-full py-2 hover:bg-sage-light/40 transition-colors"
                        >
                          🏃 + {tr.cardioLabel}
                        </button>
                      )}

                      {readOnly ? null : done ? (
                        <Link
                          to={`/app/new?edit=${dayWorkout(week, day).id}`}
                          className="mt-4 block text-center bg-forest text-white font-semibold py-3 rounded-full hover:bg-forest/90 transition-colors"
                        >
                          {tr.viewSummary}
                        </Link>
                      ) : (
                        <Link
                          to={`/app/new?plan=${plan.id}&week=${wi}&day=${di}`}
                          className="mt-4 block text-center bg-terracotta text-white font-semibold py-3 rounded-full hover:bg-terracotta-dark transition-colors"
                        >
                          {tr.startBtn}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
    <VideoModal open={!!video} onClose={() => setVideo(null)} url={video?.url} name={video?.name} gifId={video?.gifId} />
    <CardioModal
      open={!!cardioDay}
      onClose={() => setCardioDay(null)}
      onSaved={onCardioSaved}
      planId={plan.id}
      coachNote={cardioDay?.cardio}
    />
    </>
  );
}
