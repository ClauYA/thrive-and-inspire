import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import LineChart from "./LineChart";
import { Button } from "../ui";

export default function Progress() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState("");
  const [metric, setMetric] = useState("top_weight");
  const [points, setPoints] = useState(null);
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

  const exportExcel = async () => {
    setExporting(true);
    setError("");
    try {
      const XLSX = await import("xlsx");
      const d = await userApi("/api/export");
      const rows = d.rows.map((r) => ({
        Date: r.date,
        Workout: r.title,
        Exercise: r.exercise_name,
        Set: r.set_number,
        Weight: r.weight,
        Reps: r.reps,
        RIR: r.rir,
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
    "px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white cursor-pointer";

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[820px] mx-auto px-[5%] py-10">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="font-display text-[2rem] font-semibold text-charcoal">{tr.progress}</h1>
          <Button onClick={exportExcel} disabled={exporting} variant="forest" size="sm">
            {exporting ? tr.exporting : `📥 ${tr.exportExcel}`}
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6">
          <div className="flex flex-wrap gap-3 mb-5">
            <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className={inputClass}>
              <option value="">{tr.selectExercise}</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            {exerciseId && (
              <select value={metric} onChange={(e) => setMetric(e.target.value)} className={inputClass}>
                {metrics.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

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
                    {delta > 0 ? "▲ +" : delta < 0 ? "▼ " : ""}
                    {delta}
                  </span>
                </div>
              )}
              <LineChart points={chartPoints} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
