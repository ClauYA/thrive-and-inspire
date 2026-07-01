import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { recommendation, toneStyles } from "../../lib/recommend";
import { formatDate } from "../../lib/format";
import { RIR_OPTIONS, rirLabel } from "../../lib/rir";
import MemberHeader from "./MemberHeader";
import { Button } from "../ui";

const todayStr = () => new Date().toISOString().slice(0, 10);
const DRAFT_KEY = "li-workout-draft"; // in-progress workout, survives a page refresh
const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";
const emptySet = (unit = "kg") => ({ weight: "", reps: "", rir: "", unit });

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
  // Honor a ?date=YYYY-MM-DD param (e.g. picked from the calendar); else today.
  const dateParam = searchParams.get("date");
  const editId = searchParams.get("edit"); // editing an existing workout
  const [date, setDate] = useState(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr());
  const [unit] = useState("kg"); // default unit for newly added sets (each set can override)
  const [notes, setNotes] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [started, setStarted] = useState(false);
  const [fromRoutine, setFromRoutine] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [dayNotes, setDayNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showRirInfo, setShowRirInfo] = useState(false);
  const [muscle, setMuscle] = useState("");
  const [routinePlan, setRoutinePlan] = useState(null);
  const [dayPos, setDayPos] = useState({ wi: 0, di: 0 });
  const [draftRestored, setDraftRestored] = useState(false);
  const [flashUid, setFlashUid] = useState(null);
  // Session feedback captured when saving the day's workout.
  const [sessionFeel, setSessionFeel] = useState("");
  const [sessionEffort, setSessionEffort] = useState("");
  const [muscleIntensity, setMuscleIntensity] = useState({});
  const uid = useRef(0);

  // Muscle groups worked this session (from the chosen exercises).
  const workedMuscles = [
    ...new Set(
      blocks
        .map((b) => (exercises.find((x) => x.id === b.exerciseId) || {}).muscle_group)
        .filter(Boolean)
    ),
  ].sort();

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const persistDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ savedAt: Date.now(), title, date, notes, planId, fromRoutine, dayNotes, dayPos, routinePlan, blocks, sessionFeel, sessionEffort, muscleIntensity })
      );
    } catch { /* ignore */ }
  };

  // Prefill the logger from a plan's week/day: title, day notes, and exercise
  // blocks with their targets. Used by the initial load and the day picker.
  const applyDay = (planObj, wi, di, exList) => {
    const week = planObj?.weeks?.[wi];
    const day = week?.days?.[di];
    if (!day) return;
    setTitle(`${week.name} · ${day.name}`);
    setDayNotes([week?.notes, day.notes].filter(Boolean).join(" · "));
    setDayPos({ wi, di });
    const nb = (day.exercises || [])
      .map((pe) => {
        const ex = (exList || exercises).find((x) => x.id === pe.exerciseId);
        return ex ? makeBlock(ex, pe) : null;
      })
      .filter(Boolean);
    setBlocks(nb.length ? nb : [makeBlock(null)]);
    setStarted(true);
    nb.forEach((b) => loadLast(b.uid, b.exerciseId));
  };

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

        // Edit an existing workout: load it into the logger.
        if (editId) {
          try {
            const r = await userApi(`/api/workouts/${editId}`);
            if (!active) return;
            const map = new Map();
            const groups = [];
            for (const s of r.sets || []) {
              const k = s.exercise_id || s.exercise_name;
              if (!map.has(k)) { const g = { exId: s.exercise_id, exName: s.exercise_name, sets: [] }; map.set(k, g); groups.push(g); }
              map.get(k).sets.push(s);
            }
            const nb = groups.map((g) => ({
              uid: ++uid.current,
              exerciseId: g.exId || "",
              exerciseName: g.exName,
              mediaUrl: (d.exercises.find((x) => x.id === g.exId) || {}).media_url || "",
              sets: g.sets.map((s) => ({ weight: s.weight ?? "", reps: s.reps ?? "", rir: s.rir || "", unit: s.weight_unit || "kg" })),
              note: (g.sets.find((s) => s.note) || {}).note || "",
              target: null,
              last: undefined,
            }));
            setTitle(r.workout.title || tr.defaultTitle);
            setDate(String(r.workout.performed_at).slice(0, 10));
            setNotes(r.workout.notes || "");
            setPlanId(r.workout.plan_id || null);
            setSessionFeel(r.workout.session_feel || "");
            setSessionEffort(r.workout.session_effort || "");
            setMuscleIntensity(r.workout.muscle_intensity || {});
            setBlocks(nb.length ? nb : [makeBlock(null)]);
            setStarted(true);
            nb.forEach((b) => b.exerciseId && loadLast(b.uid, b.exerciseId));
          } catch (e) {
            if (e.unauthorized) navigate("/login");
            else setError(e.message);
          }
          return;
        }

        const planParam = searchParams.get("plan");
        const weekParam = searchParams.get("week");
        const dayParam = searchParams.get("day");

        // Restore an autosaved draft (e.g. after an accidental refresh).
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) {
            const dr = JSON.parse(raw);
            const fresh = dr.savedAt && Date.now() - dr.savedAt < 24 * 60 * 60 * 1000;
            const matches = planParam ? String(dr.planId) === String(planParam) : true;
            if (fresh && matches && Array.isArray(dr.blocks) && dr.blocks.length) {
              setTitle(dr.title || tr.defaultTitle);
              setDate(dr.date || todayStr());
              setNotes(dr.notes || "");
              setPlanId(dr.planId || null);
              setFromRoutine(!!dr.fromRoutine);
              setDayNotes(dr.dayNotes || "");
              setDayPos(dr.dayPos || { wi: 0, di: 0 });
              setRoutinePlan(dr.routinePlan || null);
              setBlocks(dr.blocks);
              setSessionFeel(dr.sessionFeel || "");
              setSessionEffort(dr.sessionEffort || "");
              setMuscleIntensity(dr.muscleIntensity || {});
              uid.current = Math.max(0, ...dr.blocks.map((b) => b.uid || 0)) + 1;
              setStarted(true);
              setDraftRestored(true);
              dr.blocks.forEach((b) => b.exerciseId && loadLast(b.uid, b.exerciseId));
              return; // don't re-apply the plan over the restored draft
            }
          }
        } catch { /* ignore bad draft */ }

        if (planParam && weekParam != null && dayParam != null) {
          const r = await userApi(`/api/plans/${planParam}`);
          if (!active) return;
          const wi = Number(weekParam);
          const di = Number(dayParam);
          if (r.plan?.weeks?.[wi]?.days?.[di]) {
            setRoutinePlan(r.plan);
            setFromRoutine(true);
            setPlanId(planParam);
            applyDay(r.plan, wi, di, d.exercises);
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

  // Autosave the in-progress workout so a page refresh never loses logged sets.
  useEffect(() => {
    if (!started || editId) return; // editing uses the saved row, not a draft
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ savedAt: Date.now(), title, date, notes, planId, fromRoutine, dayNotes, dayPos, routinePlan, blocks, sessionFeel, sessionEffort, muscleIntensity })
      );
    } catch { /* storage full / disabled — ignore */ }
  }, [started, title, date, notes, planId, fromRoutine, dayNotes, dayPos, routinePlan, blocks, sessionFeel, sessionEffort, muscleIntensity]);

  const makeBlock = (ex, target) => {
    const count = target && Number(target.sets) > 0 ? Number(target.sets) : 3;
    const rir = target && RIR_OPTIONS.includes(target.rir) ? target.rir : "";
    return {
      uid: ++uid.current,
      exerciseId: ex?.id || "",
      exerciseName: ex?.name || "",
      mediaUrl: ex?.media_url || "",
      sets: Array.from({ length: count }, () => ({ weight: "", reps: "", rir, unit })),
      note: "",
      target: target ? { reps: target.reps || "", rir: target.rir || "", notes: target.notes || "" } : null,
      last: ex ? undefined : null,
    };
  };

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
  const addSet = (u) => setBlocks((bs) => bs.map((b) => (b.uid === u ? { ...b, sets: [...b.sets, emptySet(unit)] } : b)));
  const setBlockNote = (u) => (e) => setBlocks((bs) => bs.map((b) => (b.uid === u ? { ...b, note: e.target.value } : b)));
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
        flatSets.push({ exerciseId: blk.exerciseId || null, exerciseName: blk.exerciseName, setNumber: idx + 1, weight: s.weight, reps: s.reps, rir: s.rir, rpe: "", unit: s.unit || unit, note: idx === 0 ? (blk.note || "") : "" });
      });
    }
    if (flatSets.length === 0) {
      setError(tr.needSet);
      return;
    }
    if (flatSets.some((s) => Number(s.weight) < 0)) {
      setError(tr.weightPositive);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const feedback = { sessionFeel, sessionEffort, muscleIntensity };
      if (editId) {
        await userApi(`/api/workouts/${editId}`, "PUT", { title, performedAt: date || null, notes, sets: flatSets, weightUnit: unit, ...feedback });
      } else {
        await userApi("/api/workouts", "POST", { title, performedAt: date || null, notes, sets: flatSets, planId, weightUnit: unit, ...feedback });
        clearDraft();
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
            {draftRestored && (
              <div className="flex items-center justify-between gap-3 bg-gold/15 border border-gold/40 rounded-2xl px-4 py-3 mb-4">
                <span className="text-[0.84rem] text-charcoal">↩️ {tr.draftRestored}</span>
                <button
                  onClick={() => { clearDraft(); setDraftRestored(false); setBlocks([]); setStarted(false); }}
                  className="text-[0.8rem] font-semibold text-terracotta hover:text-terracotta-dark shrink-0"
                >
                  {tr.discardDraft}
                </button>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6 mb-5 grid gap-4">
              {fromRoutine && routinePlan && (
                <div>
                  <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.chooseDay}</label>
                  <select
                    value={`${dayPos.wi}-${dayPos.di}`}
                    onChange={(e) => { const [wi, di] = e.target.value.split("-").map(Number); applyDay(routinePlan, wi, di); }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {routinePlan.weeks.map((w, wi) =>
                      (w.days || []).map((dd, di) => (
                        <option key={`${wi}-${di}`} value={`${wi}-${di}`}>{w.name} · {dd.name}</option>
                      ))
                    )}
                  </select>
                </div>
              )}
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
            </div>

            {/* Plan day notes (tempo, intensity, cues) */}
            {dayNotes && (
              <div className="bg-gold/10 border border-gold/40 rounded-2xl p-4 mb-4">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-charcoal/70 mb-1">{tr.planNotesLabel}</div>
                <p className="text-[0.86rem] text-charcoal leading-[1.5] whitespace-pre-wrap">{dayNotes}</p>
              </div>
            )}

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

                  {blk.target && (blk.target.reps || blk.target.rir || blk.sets.length) && (
                    <div className="mt-2 inline-block bg-gold/15 text-charcoal/80 text-[0.76rem] font-medium px-2.5 py-1 rounded-full">
                      {tr.targetLabel}: {blk.sets.length}{blk.target.reps ? `×${blk.target.reps}` : ""}{blk.target.rir ? ` · RIR ${blk.target.rir}` : ""}
                    </div>
                  )}
                  {blk.target && blk.target.notes && (
                    <div className="mt-1 text-[0.78rem] text-warm-gray italic">{blk.target.notes}</div>
                  )}

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
                    <div className="grid grid-cols-[18px_1.6fr_1fr_1.1fr_18px] gap-1.5 sm:gap-2 items-center text-[0.72rem] font-semibold text-warm-gray mb-1.5 px-1">
                      <span>{tr.set}</span>
                      <span>{tr.weight}</span>
                      <span>{tr.reps}</span>
                      <span>{tr.rir}</span>
                      <span />
                    </div>
                    {blk.sets.map((s, si) => (
                      <div key={si} className="grid grid-cols-[18px_1.6fr_1fr_1.1fr_18px] gap-1.5 sm:gap-2 items-center mb-2">
                        <span className="text-[0.85rem] text-warm-gray text-center">{si + 1}</span>
                        <div className="flex gap-1 min-w-0">
                          <input type="number" inputMode="decimal" min="0" step="0.5" value={s.weight} onChange={updateSet(blk.uid, si, "weight")} className={`${inputClass} min-w-0`} />
                          <select value={s.unit || "kg"} onChange={updateSet(blk.uid, si, "unit")} aria-label={tr.weightUnit} className={`${inputClass} cursor-pointer w-[58px] px-1.5`}>
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                          </select>
                        </div>
                        <select value={s.reps} onChange={updateSet(blk.uid, si, "reps")} className={`${inputClass} cursor-pointer`}>
                          <option value="">–</option>
                          {Array.from({ length: 51 }, (_, n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <select value={s.rir} onChange={updateSet(blk.uid, si, "rir")} className={`${inputClass} cursor-pointer`}>
                          <option value="">–</option>
                          {RIR_OPTIONS.map((o) => (
                            <option key={o} value={o}>{rirLabel(o, tr.failure)}</option>
                          ))}
                        </select>
                        <button onClick={() => removeSet(blk.uid, si)} aria-label={tr.removeSet} className="text-warm-gray hover:text-red-500 transition-colors text-lg leading-none">
                          −
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <button onClick={() => addSet(blk.uid)} className="text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark">
                        {tr.addSet}
                      </button>
                      <button
                        onClick={() => { persistDraft(); setFlashUid(blk.uid); setTimeout(() => setFlashUid((c) => (c === blk.uid ? null : c)), 1800); }}
                        className="text-[0.8rem] font-semibold text-forest border border-sage-light px-3 py-1.5 rounded-full hover:bg-sage-light/40"
                      >
                        {flashUid === blk.uid ? `✓ ${tr.saved}` : `💾 ${tr.saveExercise}`}
                      </button>
                    </div>
                    <textarea
                      rows="2"
                      value={blk.note || ""}
                      onChange={setBlockNote(blk.uid)}
                      placeholder={tr.exNotePh}
                      className={`${inputClass} resize-none mt-3`}
                    />
                  </div>
                </div>
              );
            })}

            <button onClick={addBlock} className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3.5 rounded-2xl hover:bg-sage-light/20 transition-colors mb-4">
              + {tr.addExercise}
            </button>

            {/* Cool-down */}
            <GuideCard title={`🧘 ${tr.cooldownTitle}`} steps={tr.cooldownSteps} />

            {/* Session feedback — how the routine felt */}
            <div className="bg-white rounded-2xl border border-sand p-5 sm:p-6 mb-4 grid gap-5">
              <div className="font-display text-[1.15rem] font-semibold text-charcoal">{tr.feedbackTitle}</div>

              {/* Q1 — intensity 1-10 */}
              <div>
                <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{tr.sessionFeelQ}</label>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSessionFeel(n)}
                      className={`w-9 h-9 rounded-full text-[0.85rem] font-semibold border transition-colors ${
                        Number(sessionFeel) === n ? "bg-terracotta text-white border-terracotta" : "bg-white text-warm-gray border-sand hover:border-terracotta"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 — effort */}
              <div>
                <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{tr.effortQ}</label>
                <div className="flex flex-wrap gap-2">
                  {[["easy", tr.effortEasy], ["moderate", tr.effortModerate], ["hard", tr.effortHard], ["limit", tr.effortLimit]].map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSessionEffort(k)}
                      className={`px-4 py-2 rounded-full text-[0.82rem] font-semibold border transition-colors ${
                        sessionEffort === k ? "bg-forest text-white border-forest" : "bg-white text-warm-gray border-sand hover:border-forest"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 — per-muscle intensity 1-5 */}
              {workedMuscles.length > 0 && (
                <div>
                  <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{tr.muscleIntensityQ}</label>
                  <div className="grid gap-2">
                    {workedMuscles.map((m) => (
                      <div key={m} className="flex items-center justify-between gap-3">
                        <span className="text-[0.85rem] text-charcoal capitalize">{m}</span>
                        <div className="flex gap-1.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setMuscleIntensity((mi) => ({ ...mi, [m]: n }))}
                              className={`w-8 h-8 rounded-full text-[0.8rem] font-semibold border transition-colors ${
                                Number(muscleIntensity[m]) === n ? "bg-terracotta text-white border-terracotta" : "bg-white text-warm-gray border-sand hover:border-terracotta"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.notes}</label>
                <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr.notesPh} className={`${inputClass} resize-none`} />
              </div>
            </div>

            {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

            <div className="flex gap-3 mt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? tr.saving : tr.saveAll}
              </Button>
              <button onClick={() => { clearDraft(); navigate("/app"); }} className="text-[0.95rem] font-semibold px-6 py-3.5 rounded-full border border-sand text-warm-gray hover:bg-sand transition-colors">
                {tr.cancel}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
