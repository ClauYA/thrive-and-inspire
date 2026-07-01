import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import LineChart from "./LineChart";
import { Button } from "../ui";

const fmtVol = (n) => Math.round(Number(n) || 0).toLocaleString();
const pct = (f) => `${(Number(f) * 100) >= 0 ? "+" : ""}${(Number(f) * 100).toFixed(0)}%`;

// Trend from an evolution fraction: > +5% up, < -5% down, else stable.
function trendOf(f) {
  if (f > 0.05) return "up";
  if (f < -0.05) return "down";
  return "stable";
}

export default function Progress() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [tab, setTab] = useState("chart"); // chart | exercise | muscle
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState("");
  const [metric, setMetric] = useState("top_weight");
  const [points, setPoints] = useState(null);
  const [baseline, setBaseline] = useState(null); // imported snapshot
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    userApi("/api/exercises")
      .then((d) => setExercises(d.exercises))
      .catch((e) => {
        if (e.unauthorized) navigate("/login");
      });
    userApi("/api/progress-baseline")
      .then((d) => setBaseline(d.baseline))
      .catch(() => setBaseline([]));
  }, [navigate]);

  useEffect(() => {
    if (!exerciseId) {
      setPoints(null);
      return;
    }
    userApi(`/api/progress/${exerciseId}`)
      .then((d) => setPoints(d.points))
      .catch((e) => {
        if (e.unauthorized) navigate("/login");
      });
  }, [exerciseId, navigate]);

  const metrics = [
    { key: "top_weight", label: tr.mTopWeight },
    { key: "est_1rm", label: tr.m1rm },
    { key: "volume", label: tr.mVolume },
  ];

  const chartPoints = (points || []).map((p) => ({
    label: formatDate(p.date, lang),
    value: Math.round(Number(p[metric]) || 0),
  }));
  const first = chartPoints[0]?.value;
  const last = chartPoints[chartPoints.length - 1]?.value;
  const delta = first != null && last != null ? last - first : null;

  // Per-exercise rows filtered by the search box.
  const exerciseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (baseline || []).filter((r) => !q || r.exercise_name.toLowerCase().includes(q) || (r.muscle_group || "").toLowerCase().includes(q));
  }, [baseline, search]);

  // Aggregate the baseline by muscle group (spec's calculation).
  const muscleRows = useMemo(() => {
    const map = new Map();
    for (const r of baseline || []) {
      const g = r.muscle_group || "—";
      if (!map.has(g)) map.set(g, { group: g, count: 0, withData: 0, evoSum: 0, improving: 0, volMax: 0, volCur: 0 });
      const m = map.get(g);
      m.count++;
      m.volMax += Number(r.vol_max) || 0;
      m.volCur += Number(r.vol_current) || 0;
      if ((Number(r.vol_max) || 0) > 0) {
        m.withData++;
        m.evoSum += Number(r.evolution_pct) || 0;
        if ((Number(r.evolution_pct) || 0) > 0) m.improving++;
      }
    }
    return [...map.values()]
      .map((m) => ({
        group: m.group,
        count: m.count,
        avgEvo: m.withData ? m.evoSum / m.withData : 0,
        volMax: m.volMax,
        volCur: m.volCur,
        inProgress: m.count ? (m.improving / m.count) * 100 : 0,
        trend: trendOf(m.withData ? m.evoSum / m.withData : 0),
      }))
      .sort((a, b) => b.volMax - a.volMax);
  }, [baseline]);

  const exportExcel = async () => {
    setExporting(true);
    setError("");
    try {
      const XLSX = await import("xlsx");
      const d = await userApi("/api/export");
      const rows = d.rows.map((r) => ({
        Date: r.date, Workout: r.title, Exercise: r.exercise_name, Set: r.set_number, Weight: r.weight, Reps: r.reps, RIR: r.rir,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Workouts");
      XLSX.writeFile(wb, "lift-and-inspire-workouts.xlsx");
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    "px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white";

  const trendBadge = (trend) => {
    const map = {
      up: { cls: "text-forest", icon: "▲", label: tr.trendUp },
      down: { cls: "text-terracotta-dark", icon: "▼", label: tr.trendDown },
      stable: { cls: "text-warm-gray", icon: "●", label: tr.trendStable },
    };
    const m = map[trend];
    return <span className={`font-semibold ${m.cls}`}>{m.icon} {m.label}</span>;
  };

  const evoCls = (f) => (f > 0.05 ? "text-forest" : f < -0.05 ? "text-terracotta-dark" : "text-warm-gray");

  const tabs = [
    { key: "chart", label: tr.tabChart },
    { key: "exercise", label: tr.tabByExercise },
    { key: "muscle", label: tr.tabByMuscle },
  ];

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[900px] mx-auto px-[5%] py-10">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="font-display text-[2rem] font-semibold text-charcoal">{tr.progress}</h1>
          <Button onClick={exportExcel} disabled={exporting} variant="forest" size="sm">
            {exporting ? tr.exporting : `📥 ${tr.exportExcel}`}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-sand rounded-full p-1 w-fit mb-5">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`text-[0.82rem] font-semibold px-4 py-1.5 rounded-full transition-colors ${tab === tb.key ? "bg-terracotta text-white" : "text-warm-gray"}`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

        {/* Chart tab */}
        {tab === "chart" && (
          <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6">
            <div className="flex flex-wrap gap-3 mb-5">
              <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="">{tr.selectExercise}</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              {exerciseId && (
                <select value={metric} onChange={(e) => setMetric(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  {metrics.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              )}
            </div>
            {!exerciseId ? (
              <p className="text-warm-gray text-center py-12">{tr.pickToSeeProgress}</p>
            ) : points === null ? (
              <p className="text-warm-gray text-center py-12">{tr.loading}</p>
            ) : chartPoints.length === 0 ? (
              <p className="text-warm-gray text-center py-12">{tr.noProgressData}</p>
            ) : (
              <>
                {delta != null && chartPoints.length > 1 && (
                  <div className="mb-4 text-[0.88rem]">
                    <span className="text-warm-gray">{tr.change}: </span>
                    <span className={`font-semibold ${delta > 0 ? "text-forest" : delta < 0 ? "text-terracotta-dark" : "text-warm-gray"}`}>
                      {delta > 0 ? "▲ +" : delta < 0 ? "▼ " : ""}{delta}
                    </span>
                  </div>
                )}
                <LineChart points={chartPoints} />
              </>
            )}
          </div>
        )}

        {/* By exercise tab */}
        {tab === "exercise" && (
          <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr.searchExercise} className={`${inputClass} w-full mb-4`} />
            {baseline === null ? (
              <p className="text-warm-gray text-center py-12">{tr.loading}</p>
            ) : exerciseRows.length === 0 ? (
              <p className="text-warm-gray text-center py-12">{baseline.length === 0 ? tr.noBaseline : "—"}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-[0.84rem]">
                    <thead>
                      <tr className="text-warm-gray text-left border-b border-sand">
                        <th className="font-semibold py-2 pr-3">{tr.colExercise}</th>
                        <th className="font-semibold py-2 pr-3">{tr.colGroup}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colEvolution}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colVolMax}</th>
                        <th className="font-semibold py-2 text-right">{tr.colVolCurrent}</th>
                      </tr>
                    </thead>
                    <tbody className="text-charcoal">
                      {exerciseRows.map((r, i) => (
                        <tr key={i} className="border-b border-sand/60">
                          <td className="py-2 pr-3 font-medium">{r.exercise_name}</td>
                          <td className="py-2 pr-3 text-warm-gray">{r.muscle_group}</td>
                          <td className={`py-2 pr-3 text-right font-semibold ${evoCls(r.evolution_pct)}`}>{pct(r.evolution_pct)}</td>
                          <td className="py-2 pr-3 text-right">{fmtVol(r.vol_max)}</td>
                          <td className="py-2 text-right">{fmtVol(r.vol_current)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[0.74rem] text-light-gray mt-3">{tr.baselineNote}</p>
              </>
            )}
          </div>
        )}

        {/* By muscle group tab */}
        {tab === "muscle" && (
          <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6">
            {baseline === null ? (
              <p className="text-warm-gray text-center py-12">{tr.loading}</p>
            ) : muscleRows.length === 0 ? (
              <p className="text-warm-gray text-center py-12">{tr.noBaseline}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-[0.84rem]">
                    <thead>
                      <tr className="text-warm-gray text-left border-b border-sand">
                        <th className="font-semibold py-2 pr-3">{tr.colGroup}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colCount}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colAvgEvolution}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colVolMax}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colVolCurrent}</th>
                        <th className="font-semibold py-2 pr-3 text-right">{tr.colInProgress}</th>
                        <th className="font-semibold py-2 text-right">{tr.colTrend}</th>
                      </tr>
                    </thead>
                    <tbody className="text-charcoal">
                      {muscleRows.map((m, i) => (
                        <tr key={i} className="border-b border-sand/60">
                          <td className="py-2 pr-3 font-medium">{m.group}</td>
                          <td className="py-2 pr-3 text-right">{m.count}</td>
                          <td className={`py-2 pr-3 text-right font-semibold ${evoCls(m.avgEvo)}`}>{pct(m.avgEvo)}</td>
                          <td className="py-2 pr-3 text-right">{fmtVol(m.volMax)}</td>
                          <td className="py-2 pr-3 text-right">{fmtVol(m.volCur)}</td>
                          <td className="py-2 pr-3 text-right">{Math.round(m.inProgress)}%</td>
                          <td className="py-2 text-right">{trendBadge(m.trend)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[0.74rem] text-light-gray mt-3">{tr.baselineNote}</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
