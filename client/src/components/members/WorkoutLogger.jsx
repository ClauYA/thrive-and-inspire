import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { recommendation, toneStyles } from "../../lib/recommend";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import { Button } from "../ui";

const todayStr = () => new Date().toISOString().slice(0, 10);
const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";
const emptySet = () => ({ weight: "", reps: "", rir: "" });

// Muscle groups (lowercase) used to generate each workout type.
const GEN_GROUPS = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
  legs: ["legs", "hamstrings", "quads", "glutes"],
  full: ["legs", "chest", "back", "shoulders", "core"],
};

function youtubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

// Shows the exercise demo via YouTube: embeds a specific video if media_url is
// a YouTube link, otherwise links to a YouTube search for the exercise.
function ExerciseMedia({ url, name }) {
  const { t } = useLanguage();
  const tr = t.tracker;
  const [show, setShow] = useState(false);
  const embed = youtubeEmbed(url);

  if (embed) {
    return (
      <div className="mt-3">
        <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark">
          ▶ {show ? tr.hideMedia : tr.watchVideo}
        </button>
        {show && (
          <div className="mt-2 aspect-video">
            <iframe className="w-full h-full rounded-xl" src={embed} title={name || "video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        )}
      </div>
    );
  }
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark">
        ▶ {tr.watchVideo} ↗
      </a>
    );
  }
  if (!name) return null;
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent("how to " + name)}`;
  return (
    <a href={search} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark">
      ▶ {tr.watchYoutube} ↗
    </a>
  );
}

function GuideCard({ title, steps }) {
  return (
    <div className="bg-sage-light/25 border border-sage-light rounded-2xl p-4 sm:p-5 mb-4">
      <h3 className="text-[0.9rem] font-semibold text-forest mb-2">{title}</h3>
      <ul className="grid gap-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-[0.84rem] text-charcoal/80 leading-[1.5]">
            <span className="text-forest mt-0.5 shrink-0">•</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
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
  const [muscle, setMuscle] = useState("");
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

        const dayParam = searchParams.get("day");
        if (dayParam != null) {
          const r = await userApi("/api/routine");
          if (!active) return;
          const day = r.routine?.days?.[Number(dayParam)];
          if (day) {
            setTitle(day.name);
            setFromRoutine(true);
            const newBlocks = day.exerciseIds.map((id) => d.exercises.find((ex) => ex.id === id)).filter(Boolean).map((ex) => makeBlock(ex));
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
    last: ex ? undefined : null,
  });

  const loadLast = (blockUid, exerciseId) => {
    if (!exerciseId) return;
    userApi(`/api/last-performance/${exerciseId}`)
      .then((d) => setBlocks((bs) => bs.map((b) => (b.uid === blockUid ? { ...b, last: { sets: d.sets, performedAt: d.performedAt } } : b))))
      .catch(() => setBlocks((bs) => bs.map((b) => (b.uid === blockUid ? { ...b, last: { sets: [], performedAt: null } } : b))));
  };

  const startWith = (picks, newTitle) => {
    const nb = picks.map((ex) => makeBlock(ex));
    setBlocks(nb.length ? nb : [makeBlock(null)]);
    if (newTitle) setTitle(newTitle);
    setStarted(true);
    nb.forEach((b) => loadLast(b.uid, b.exerciseId));
  };

  const pickFrom = (groups, count) => {
    const pool = exercises.filter((e) => groups.includes((e.muscle_group || "").toLowerCase()));
    return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  };

  const generate = (key) => {
    let picks;
    if (key === "full") {
      picks = GEN_GROUPS.full.map((g) => pickFrom([g], 1)[0]).filter(Boolean);
    } else {
      picks = pickFrom(GEN_GROUPS[key], 5);
    }
    startWith(picks, tr[`gen_${key}`]);
  };

  const generateMuscle = (group) => {
    if (!group) return;
    startWith(pickFrom([group.toLowerCase()], 5), group);
  };

  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))].sort();

  const addBlock = () => setBlocks((b) => [...b, makeBlock(null)]);
  const removeBlock = (u) => setBlocks((b) => b.filter((blk) => blk.uid !== u));
  const pickExercise = (u) => (e) => {
    const ex = exercises.find((x) => x.id === e.target.value);
    setBlocks((bs) => bs.map((b) => (b.uid === u ? { ...b, exerciseId: ex?.id || "", exerciseName: ex?.name || "", mediaUrl: ex?.media_url || "", last: ex ? undefined : null } : b)));
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
        flatSets.push({ exerciseId: blk.exerciseId || null, exerciseName: blk.exerciseName, setNumber: idx + 1, weight: s.weight, reps: s.reps, rir: s.rir, rpe: "" });
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

  const generators = [
    { key: "push", emoji: "🙌", label: tr.gen_push },
    { key: "pull", emoji: "💪", label: tr.gen_pull },
    { key: "legs", emoji: "🦵", label: tr.gen_legs },
    { key: "full", emoji: "🔥", label: tr.gen_full },
  ];

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[760px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>

        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-6">{tr.newWorkout}</h1>

        {/* Start screen: generate a workout or start blank */}
        {!started && (
          <div className="bg-white rounded-2xl border border-sand p-6 mb-5">
            <h2 className="font-semibold text-charcoal mb-1">{tr.chooseWorkout}</h2>
            <p className="text-[0.84rem] text-warm-gray mb-5">{tr.chooseWorkoutSub}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {generators.map((gen) => (
                <button
                  key={gen.key}
                  onClick={() => generate(gen.key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-sand hover:border-terracotta hover:bg-terracotta/5 hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-2xl">{gen.emoji}</span>
                  <span className="text-[0.82rem] font-semibold text-charcoal text-center">{gen.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select value={muscle} onChange={(e) => { setMuscle(e.target.value); generateMuscle(e.target.value); }} className={`${inputClass} cursor-pointer max-w-[240px]`}>
                <option value="">{tr.byMuscle}</option>
                {muscleGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <button onClick={() => startWith([], tr.defaultTitle)} className="text-[0.85rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full hover:bg-sage-light/30 transition-colors">
                ✏️ {tr.tpl_custom}
              </button>
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

            {/* Warm-up */}
            <GuideCard title={`🔥 ${tr.warmupTitle}`} steps={tr.warmupSteps} />

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

                  <ExerciseMedia url={blk.mediaUrl} name={blk.exerciseName} />

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
                          <option value="0">{`0 · ${tr.failure}`}</option>
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

            <button onClick={addBlock} className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3.5 rounded-2xl hover:bg-sage-light/20 transition-colors mb-4">
              + {tr.addExercise}
            </button>

            {/* Cool-down */}
            <GuideCard title={`🧘 ${tr.cooldownTitle}`} steps={tr.cooldownSteps} />

            {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

            <div className="flex gap-3 mt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? tr.saving : tr.save}
              </Button>
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
