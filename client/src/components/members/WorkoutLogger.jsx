import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { recommendation, toneStyles } from "../../lib/recommend";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";

const todayStr = () => new Date().toISOString().slice(0, 10);
const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";
const emptySet = () => ({ weight: "", reps: "", rir: "" });

// Predefined templates reference exercise names from the starter library.
const TEMPLATES = {
  upper: ["Bench Press", "Overhead Press", "Lat Pulldown", "Seated Row", "Lateral Raise", "Bicep Curl", "Tricep Pushdown"],
  lower: ["Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Leg Extension", "Hip Thrust"],
  full: ["Back Squat", "Bench Press", "Barbell Row", "Overhead Press", "Romanian Deadlift", "Plank"],
  custom: [],
};

function ExerciseMedia({ url }) {
  if (!url) return null;
  const isVideo = /\.(mp4|webm|mov)$/i.test(url);
  return isVideo ? (
    <video src={url} autoPlay loop muted playsInline className="w-full max-h-56 object-contain rounded-xl bg-charcoal/5 mt-3" />
  ) : (
    <img src={url} alt="" className="w-full max-h-56 object-contain rounded-xl bg-charcoal/5 mt-3" />
  );
}

export default function WorkoutLogger() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [exercises, setExercises] = useState([]);
  const [title, setTitle] = useState(tr.defaultTitle);
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [started, setStarted] = useState(false);
  const [fromRoutine, setFromRoutine] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showRirInfo, setShowRirInfo] = useState(false);
  const uid = useRef(0);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    let active = true;
    (async () => {
      try {
        const d = await userApi("/api/exercises");
        if (!active) return;
        setExercises(d.exercises);

        // If launched from a routine day (?day=N), prefill its exercises.
        const dayParam = searchParams.get("day");
        if (dayParam != null) {
          const r = await userApi("/api/routine");
          if (!active) return;
          const day = r.routine?.days?.[Number(dayParam)];
          if (day) {
            setTitle(day.name);
            setFromRoutine(true);
            const newBlocks = day.exerciseIds
              .map((id) => d.exercises.find((ex) => ex.id === id))
              .filter(Boolean)
              .map((ex) => makeBlock(ex));
            setBlocks(newBlocks);
            setStarted(true);
            newBlocks.forEach((b) => loadLast(b.uid, b.exerciseId));
          }
        }
      } catch (e) {
        if (e.unauthorized) navigate("/login");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, searchParams]);

  const makeBlock = (ex) => ({
    uid: ++uid.current,
    exerciseId: ex?.id || "",
    exerciseName: ex?.name || "",
    mediaUrl: ex?.media_url || "",
    sets: [emptySet(), emptySet(), emptySet()],
    last: ex ? undefined : null, // undefined = loading, null = none/manual-empty
  });

  // Load last performance for a block (by uid) once an exercise is chosen.
  const loadLast = (blockUid, exerciseId) => {
    if (!exerciseId) return;
    userApi(`/api/last-performance/${exerciseId}`)
      .then((d) => {
        setBlocks((bs) => bs.map((b) => (b.uid === blockUid ? { ...b, last: { sets: d.sets, performedAt: d.performedAt } } : b)));
      })
      .catch(() => {
        setBlocks((bs) => bs.map((b) => (b.uid === blockUid ? { ...b, last: { sets: [], performedAt: null } } : b)));
      });
  };

  const applyTemplate = (key) => {
    const names = TEMPLATES[key];
    if (key === "custom" || names.length === 0) {
      const b = { ...makeBlock(null), sets: [emptySet(), emptySet(), emptySet()] };
      setBlocks([b]);
    } else {
      const newBlocks = names
        .map((n) => exercises.find((ex) => ex.name.toLowerCase() === n.toLowerCase()))
        .filter(Boolean)
        .map((ex) => makeBlock(ex));
      setBlocks(newBlocks);
      newBlocks.forEach((b) => loadLast(b.uid, b.exerciseId));
      if (key !== "full") setTitle(tr[`tpl_${key}`] || tr.defaultTitle);
    }
    setStarted(true);
  };

  const addBlock = () => setBlocks((b) => [...b, makeBlock(null)]);
  const removeBlock = (u) => setBlocks((b) => b.filter((blk) => blk.uid !== u));

  const pickExercise = (u) => (e) => {
    const ex = exercises.find((x) => x.id === e.target.value);
    setBlocks((bs) =>
      bs.map((b) => (b.uid === u ? { ...b, exerciseId: ex?.id || "", exerciseName: ex?.name || "", mediaUrl: ex?.media_url || "", last: ex ? undefined : null } : b))
    );
    if (ex) loadLast(u, ex.id);
  };

  const addSet = (u) => setBlocks((bs) => bs.map((b) => (b.uid === u ? { ...b, sets: [...b.sets, emptySet()] } : b)));
  const removeSet = (u, si) => setBlocks((bs) => bs.map((b) => (b.uid === u ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b)));
  const updateSet = (u, si, field) => (e) => {
    const val = e.target.value;
    setBlocks((bs) => bs.map((b) => (b.uid === u ? { ...b, sets: b.sets.map((s, j) => (j === si ? { ...s, [field]: val } : s)) } : b)));
  };

  const save = async () => {
    const flatSets = [];
    for (const blk of blocks) {
      if (!blk.exerciseName) continue;
      blk.sets.forEach((s, idx) => {
        flatSets.push({
          exerciseId: blk.exerciseId || null,
          exerciseName: blk.exerciseName,
          setNumber: idx + 1,
          weight: s.weight,
          reps: s.reps,
          rir: s.rir,
          rpe: "",
        });
      });
    }
    if (flatSets.length === 0) {
      setError(tr.needSet);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await userApi("/api/workouts", "POST", { title, performedAt: date || null, notes, sets: flatSets });
      if (fromRoutine) {
        try {
          await userApi("/api/routine/advance", "POST");
        } catch {
          /* non-blocking */
        }
      }
      navigate("/app");
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const templates = [
    { key: "upper", emoji: "💪", label: tr.tpl_upper },
    { key: "lower", emoji: "🦵", label: tr.tpl_lower },
    { key: "full", emoji: "🔥", label: tr.tpl_full },
    { key: "custom", emoji: "✏️", label: tr.tpl_custom },
  ];

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[760px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>

        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-6">{tr.newWorkout}</h1>

        {/* Template picker */}
        {!started && (
          <div className="bg-white rounded-2xl border border-sand p-6 mb-5">
            <h2 className="font-semibold text-charcoal mb-1">{tr.chooseTemplate}</h2>
            <p className="text-[0.84rem] text-warm-gray mb-5">{tr.chooseTemplateSub}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => applyTemplate(tpl.key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-sand hover:border-terracotta hover:bg-terracotta/5 hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-2xl">{tpl.emoji}</span>
                  <span className="text-[0.82rem] font-semibold text-charcoal text-center">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {started && (
          <>
            <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6 mb-5 grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.workoutTitle}</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.date}</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.notes}</label>
                <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr.notesPh} className={`${inputClass} resize-none`} />
              </div>
            </div>

            {/* RIR info */}
            <div className="mb-4">
              <button onClick={() => setShowRirInfo((v) => !v)} className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest">
                <span className="w-4 h-4 rounded-full bg-forest text-white text-[0.62rem] flex items-center justify-center">i</span>
                {tr.whatIsRir}
              </button>
              {showRirInfo && <p className="text-[0.82rem] text-warm-gray leading-[1.6] mt-2 bg-white border border-sand rounded-xl p-3">{tr.rirExplain}</p>}
            </div>

            {blocks.map((blk) => {
              const rec = blk.last === undefined ? null : recommendation(blk.last?.sets, lang);
              return (
                <div key={blk.uid} className="bg-white rounded-2xl border border-sand p-5 sm:p-6 mb-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <select value={blk.exerciseId} onChange={pickExercise(blk.uid)} className={`${inputClass} cursor-pointer`}>
                      <option value="">{tr.selectExercise}</option>
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                          {ex.muscle_group ? ` · ${ex.muscle_group}` : ""}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removeBlock(blk.uid)} aria-label={tr.removeExercise} className="shrink-0 text-warm-gray hover:text-red-500 transition-colors text-xl leading-none px-1">
                      ×
                    </button>
                  </div>

                  <ExerciseMedia url={blk.mediaUrl} />

                  {/* Last time + recommendation */}
                  {blk.exerciseId && (
                    <div className="mt-3 text-[0.8rem]">
                      {blk.last === undefined ? (
                        <span className="text-light-gray">…</span>
                      ) : blk.last.sets.length > 0 ? (
                        <div className="text-warm-gray">
                          <span className="font-semibold text-charcoal">{tr.lastTime}:</span>{" "}
                          {blk.last.sets.map((s, i) => (
                            <span key={i}>
                              {i > 0 ? " · " : ""}
                              {s.weight}×{s.reps}
                              {s.rir != null ? ` (RIR ${s.rir})` : ""}
                            </span>
                          ))}
                          {blk.last.performedAt ? <span className="text-light-gray"> — {formatDate(blk.last.performedAt, lang)}</span> : null}
                        </div>
                      ) : null}
                      {rec && (
                        <div className={`inline-block mt-2 px-3 py-1.5 rounded-full text-[0.78rem] font-medium ${toneStyles[rec.tone]}`}>
                          {rec.tone === "increase" ? "⬆️ " : rec.tone === "maintain" ? "➡️ " : rec.tone === "push" ? "💥 " : "✨ "}
                          {rec.text}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sets table (RIR only) */}
                  <div className="mt-4">
                    <div className="grid grid-cols-[28px_1fr_1fr_1fr_28px] gap-2 items-center text-[0.72rem] font-semibold text-warm-gray mb-1.5 px-1">
                      <span>{tr.set}</span>
                      <span>{tr.weight}</span>
                      <span>{tr.reps}</span>
                      <span>{tr.rir}</span>
                      <span />
                    </div>
                    {blk.sets.map((s, si) => (
                      <div key={si} className="grid grid-cols-[28px_1fr_1fr_1fr_28px] gap-2 items-center mb-2">
                        <span className="text-[0.85rem] text-warm-gray text-center">{si + 1}</span>
                        <input type="number" inputMode="decimal" value={s.weight} onChange={updateSet(blk.uid, si, "weight")} className={inputClass} />
                        <input type="number" inputMode="numeric" value={s.reps} onChange={updateSet(blk.uid, si, "reps")} className={inputClass} />
                        <select value={s.rir} onChange={updateSet(blk.uid, si, "rir")} className={`${inputClass} cursor-pointer`}>
                          <option value="">–</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5+</option>
                        </select>
                        <button onClick={() => removeSet(blk.uid, si)} aria-label={tr.removeSet} className="text-warm-gray hover:text-red-500 transition-colors text-lg leading-none">
                          −
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addSet(blk.uid)} className="text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark mt-1">
                      {tr.addSet}
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={addBlock}
              className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3.5 rounded-2xl hover:bg-sage-light/20 transition-colors mb-6"
            >
              + {tr.addExercise}
            </button>

            {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="bg-terracotta text-white text-[0.95rem] font-semibold px-6 py-3.5 rounded-full hover:bg-terracotta-dark transition-colors shadow-[0_8px_24px_rgba(176,125,31,0.3)] disabled:opacity-70 disabled:cursor-not-allowed">
                {saving ? tr.saving : tr.save}
              </button>
              <button onClick={() => navigate("/app")} className="text-[0.95rem] font-semibold px-6 py-3.5 rounded-full border border-sand text-warm-gray hover:bg-sand transition-colors">
                {tr.cancel}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
