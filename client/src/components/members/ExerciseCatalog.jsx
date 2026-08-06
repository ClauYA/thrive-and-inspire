import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";
import { Button, Input, Textarea, Field } from "../ui";
import { Play, ExternalLink, X } from "lucide-react";

export default function ExerciseCatalog() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [exercises, setExercises] = useState(null); // null = loading
  const [form, setForm] = useState({ name: "", muscleGroup: "", mediaUrl: "", instructions: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    userApi("/api/exercises")
      .then((d) => setExercises(d.exercises))
      .catch((e) => {
        if (e.unauthorized) navigate("/login");
        else setError(e.message);
      });
  };

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await userApi("/api/exercises", "POST", form);
      setForm({ name: "", muscleGroup: "", mediaUrl: "", instructions: "" });
      load();
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ex) => {
    if (!window.confirm(tr.confirmDeleteEx)) return;
    try {
      await userApi(`/api/exercises/${ex.id}`, "DELETE");
      load();
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    }
  };

  const own = (exercises || []).filter((e) => e.owner_id);
  const defaults = (exercises || []).filter((e) => !e.owner_id);

  const groups = [...new Set((exercises || []).map((e) => e.muscle_group).filter(Boolean))].sort();

  const Row = ({ ex, deletable }) => (
    <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-sand p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-charcoal text-[0.92rem]">{ex.name}</span>
          {ex.muscle_group && <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full bg-sage-light/50 text-forest">{ex.muscle_group}</span>}
          {!ex.owner_id && <span className="text-[0.66rem] font-semibold px-2 py-0.5 rounded-full bg-sand text-warm-gray">{tr.defaultTag}</span>}
        </div>
        {ex.media_url && (
          <a href={ex.media_url} target="_blank" rel="noopener noreferrer" className="text-[0.78rem] font-semibold text-terracotta hover:text-terracotta-dark">
            <span className="inline-flex items-center gap-1"><Play size={12} className="fill-current" /> {tr.watchVideo} <ExternalLink size={12} /></span>
          </a>
        )}
      </div>
      {deletable && (
        <button onClick={() => remove(ex)} aria-label={tr.delete} className="shrink-0 text-warm-gray hover:text-red-500 transition-colors leading-none px-1">
          <X size={18} />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[760px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>
        <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-2">{tr.catalog}</h1>
        <p className="text-[0.88rem] text-warm-gray mb-6">{tr.catalogSub}</p>

        {/* Add form */}
        <form onSubmit={add} className="bg-white rounded-2xl border border-sand p-5 sm:p-6 mb-8 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={tr.exName}>
              <Input type="text" value={form.name} onChange={update("name")} placeholder={tr.exNamePh} />
            </Field>
            <Field label={tr.exGroup}>
              <Input type="text" list="muscle-groups" value={form.muscleGroup} onChange={update("muscleGroup")} placeholder={tr.exGroupPh} />
              <datalist id="muscle-groups">
                {groups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label={tr.exMedia}>
            <Input type="url" value={form.mediaUrl} onChange={update("mediaUrl")} placeholder={tr.exMediaPh} />
          </Field>
          <Field label={tr.exInstr}>
            <Textarea rows={2} value={form.instructions} onChange={update("instructions")} placeholder={tr.exInstrPh} />
          </Field>
          <div>
            <Button type="submit" disabled={saving}>
              {saving ? tr.adding : `+ ${tr.addExerciseBtn}`}
            </Button>
          </div>
          {error && <p className="text-red-500 text-[0.85rem]">{error}</p>}
        </form>

        {exercises === null ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : (
          <>
            <h2 className="text-[0.95rem] font-semibold text-charcoal mb-3">{tr.yourExercises}</h2>
            {own.length === 0 ? (
              <p className="text-warm-gray text-[0.88rem] mb-8">{tr.noOwnExercises}</p>
            ) : (
              <div className="grid gap-2 mb-8">
                {own.map((ex) => (
                  <Row key={ex.id} ex={ex} deletable />
                ))}
              </div>
            )}

            <h2 className="text-[0.95rem] font-semibold text-charcoal mb-3">{tr.defaultExercises}</h2>
            <div className="grid gap-2">
              {defaults.map((ex) => (
                <Row key={ex.id} ex={ex} deletable={false} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
