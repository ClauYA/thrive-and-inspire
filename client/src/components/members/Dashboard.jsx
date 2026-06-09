import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";

// Group a flat list of sets by exercise name, preserving order.
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
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await userApi("/api/workouts");
      setWorkouts(d.workouts);
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
      setWorkouts([]);
    }
  }, [navigate]);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    load();
  }, [load, navigate]);

  const toggle = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!detail[id]) {
      try {
        const d = await userApi(`/api/workouts/${id}`);
        setDetail((prev) => ({ ...prev, [id]: d }));
      } catch (e) {
        if (e.unauthorized) navigate("/login");
      }
    }
  };

  const remove = async (id) => {
    if (!window.confirm(tr.confirmDelete)) return;
    try {
      await userApi(`/api/workouts/${id}`, "DELETE");
      setExpanded(null);
      load();
    } catch (e) {
      if (e.unauthorized) navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[820px] mx-auto px-[5%] py-10">
        <div className="flex items-center justify-between mb-8 gap-3">
          <h1 className="font-display text-[2rem] font-semibold text-charcoal">{tr.appTitle}</h1>
          <Link
            to="/app/new"
            className="bg-terracotta text-white text-[0.88rem] font-semibold px-5 py-2.5 rounded-full hover:bg-terracotta-dark transition-colors shadow-[0_8px_24px_rgba(176,125,31,0.3)] whitespace-nowrap"
          >
            + {tr.newWorkout}
          </Link>
        </div>

        {error && <p className="text-red-500 text-[0.85rem] mb-4">{error}</p>}

        {workouts === null ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : workouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏋️</div>
            <p className="text-warm-gray mb-6">{tr.noWorkouts}</p>
            <Link to="/app/new" className="bg-terracotta text-white text-[0.9rem] font-semibold px-6 py-3 rounded-full hover:bg-terracotta-dark transition-colors">
              + {tr.newWorkout}
            </Link>
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
                    {detail[w.id].workout.notes && (
                      <p className="text-[0.82rem] text-warm-gray italic mb-4">"{detail[w.id].workout.notes}"</p>
                    )}
                    {groupByExercise(detail[w.id].sets).map((g, gi) => (
                      <div key={gi} className="mb-4">
                        <h4 className="text-[0.88rem] font-semibold text-charcoal mb-1.5">{g.name}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[0.8rem]">
                            <thead>
                              <tr className="text-warm-gray text-left">
                                <th className="font-medium py-1 pr-3">{tr.set}</th>
                                <th className="font-medium py-1 pr-3">{tr.weight}</th>
                                <th className="font-medium py-1 pr-3">{tr.reps}</th>
                                <th className="font-medium py-1">{tr.rir}</th>
                              </tr>
                            </thead>
                            <tbody className="text-charcoal">
                              {g.sets.map((s, si) => (
                                <tr key={si} className="border-t border-sand/60">
                                  <td className="py-1.5 pr-3">{s.set_number}</td>
                                  <td className="py-1.5 pr-3">{s.weight}</td>
                                  <td className="py-1.5 pr-3">{s.reps}</td>
                                  <td className="py-1.5">{s.rir ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => remove(w.id)} className="text-[0.8rem] font-semibold text-red-500 hover:text-red-600 transition-colors mt-2">
                      {tr.delete}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
