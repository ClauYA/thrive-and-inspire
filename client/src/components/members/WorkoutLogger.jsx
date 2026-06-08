import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";

const todayStr = () => new Date().toISOString().slice(0, 10);

const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.88rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";

const emptySet = () => ({ weight: "", reps: "", rir: "", rpe: "" });

// Render a gif (image) or a video depending on the file extension.
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
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [title, setTitle] = useState(tr.defaultTitle);
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
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

  const addBlock = () =>
    setBlocks((b) => [...b, { exerciseId: "", exerciseName: "", mediaUrl: "", instructions: "", sets: [emptySet()] }]);

  const removeBlock = (bi) => setBlocks((b) => b.filter((_, i) => i !== bi));

  const pickExercise = (bi) => (e) => {
    const ex = exercises.find((x) => x.id === e.target.value);
    setBlocks((b) =>
      b.map((blk, i) =>
        i === bi
          ? { ...blk, exerciseId: ex?.id || "", exerciseName: ex?.name || "", mediaUrl: ex?.media_url || "", instructions: ex?.instructions || "" }
          : blk
      )
    );
  };

  const addSet = (bi) => setBlocks((b) => b.map((blk, i) => (i === bi ? { ...blk, sets: [...blk.sets, emptySet()] } : blk)));
  const removeSet = (bi, si) =>
    setBlocks((b) => b.map((blk, i) => (i === bi ? { ...blk, sets: blk.sets.filter((_, j) => j !== si) } : blk)));

  const updateSet = (bi, si, field) => (e) => {
    const val = e.target.value;
    setBlocks((b) =>
      b.map((blk, i) =>
        i === bi ? { ...blk, sets: blk.sets.map((s, j) => (j === si ? { ...s, [field]: val } : s)) } : blk
      )
    );
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
          rpe: s.rpe,
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
      navigate("/app");
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[760px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>

        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-6">{tr.newWorkout}</h1>

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

        {blocks.map((blk, bi) => (
          <div key={bi} className="bg-white rounded-2xl border border-sand p-5 sm:p-6 mb-4">
            <div className="flex items-start justify-between gap-3 mb-1">
              <select value={blk.exerciseId} onChange={pickExercise(bi)} className={`${inputClass} cursor-pointer`}>
                <option value="">{tr.selectExercise}</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                    {ex.muscle_group ? ` · ${ex.muscle_group}` : ""}
                  </option>
                ))}
              </select>
              <button onClick={() => removeBlock(bi)} aria-label={tr.removeExercise} className="shrink-0 text-warm-gray hover:text-red-500 transition-colors text-xl leading-none px-1">
                ×
              </button>
            </div>

            <ExerciseMedia url={blk.mediaUrl} />

            {/* Sets table */}
            <div className="mt-4">
              <div className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_28px] gap-2 items-center text-[0.72rem] font-semibold text-warm-gray mb-1.5 px-1">
                <span>{tr.set}</span>
                <span>{tr.weight}</span>
                <span>{tr.reps}</span>
                <span title={tr.rirHint}>{tr.rir}</span>
                <span title={tr.rpeHint}>{tr.rpe}</span>
                <span />
              </div>
              {blk.sets.map((s, si) => (
                <div key={si} className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_28px] gap-2 items-center mb-2">
                  <span className="text-[0.85rem] text-warm-gray text-center">{si + 1}</span>
                  <input type="number" inputMode="decimal" value={s.weight} onChange={updateSet(bi, si, "weight")} className={inputClass} />
                  <input type="number" inputMode="numeric" value={s.reps} onChange={updateSet(bi, si, "reps")} className={inputClass} />
                  <input type="number" inputMode="decimal" value={s.rir} onChange={updateSet(bi, si, "rir")} className={inputClass} />
                  <input type="number" inputMode="decimal" value={s.rpe} onChange={updateSet(bi, si, "rpe")} className={inputClass} />
                  <button onClick={() => removeSet(bi, si)} aria-label={tr.removeSet} className="text-warm-gray hover:text-red-500 transition-colors text-lg leading-none">
                    −
                  </button>
                </div>
              ))}
              <button onClick={() => addSet(bi)} className="text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark mt-1">
                {tr.addSet}
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addBlock}
          className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3.5 rounded-2xl hover:bg-sage-light/20 transition-colors mb-6"
        >
          + {tr.addExercise}
        </button>

        {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-terracotta text-white text-[0.95rem] font-semibold px-6 py-3.5 rounded-full hover:bg-terracotta-dark transition-colors shadow-[0_8px_24px_rgba(176,125,31,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? tr.saving : tr.save}
          </button>
          <button onClick={() => navigate("/app")} className="text-[0.95rem] font-semibold px-6 py-3.5 rounded-full border border-sand text-warm-gray hover:bg-sand transition-colors">
            {tr.cancel}
          </button>
        </div>
      </main>
    </div>
  );
}
