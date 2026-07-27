import { useEffect, useState } from "react";
import { apiAuth } from "../../lib/api";
import { useLanguage } from "../../i18n/LanguageContext";

const gifSrc = (id) => `/api/exercise-gif-image?id=${encodeURIComponent(id)}`;

// Coach tool: pin the correct ExerciseDB animation to each exercise when the
// automatic name match is wrong. Stores the chosen ExerciseDB id (gif_id).
export default function ExerciseGifs({ onAuthError }) {
  const { t } = useLanguage();
  const A = t.admin;
  const [exs, setExs] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const fail = (err) => { if (err.unauthorized) return onAuthError(); setError(err.message); };

  useEffect(() => {
    apiAuth("/api/admin/exercises").then((d) => setExs(d.exercises)).catch(fail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (query) => {
    setSearching(true);
    setError("");
    try {
      const d = await apiAuth(`/api/admin/exercisedb-search?q=${encodeURIComponent(query)}`);
      setResults(d.results);
    } catch (err) { fail(err); } finally { setSearching(false); }
  };

  const openEditor = (ex) => {
    setOpenId(ex.id);
    setQ(ex.name);
    setResults(null);
    setError("");
    search(ex.name);
  };

  const pick = async (exId, gifId) => {
    try {
      await apiAuth(`/api/admin/exercises/${exId}/gif`, "PATCH", { gifId });
      setExs((xs) => xs.map((x) => (x.id === exId ? { ...x, gif_id: gifId || null } : x)));
      if (gifId) setOpenId(null);
    } catch (err) { fail(err); }
  };

  if (exs === null) return <p className="text-warm-gray">{A.loading}</p>;

  return (
    <div>
      <h1 className="font-display text-[2rem] font-semibold text-charcoal mb-1.5">{A.gifManagerTitle}</h1>
      <p className="text-[0.85rem] text-warm-gray mb-6">{A.gifManagerHint}</p>
      {error && <p className="text-red-500 text-[0.85rem] mb-4">{error}</p>}
      <div className="grid gap-2">
        {exs.map((ex) => (
          <div key={ex.id} className="bg-white rounded-2xl border border-sand p-4">
            <div className="flex items-center gap-3">
              {ex.gif_id ? (
                <img src={gifSrc(ex.gif_id)} alt="" className="w-16 h-16 object-contain rounded-lg border border-sand bg-cream shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-sand bg-cream/50 flex items-center justify-center text-warm-gray text-[0.62rem] text-center px-1 shrink-0">{A.gifAuto}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-charcoal truncate">{ex.name}</div>
                <div className="text-[0.74rem] text-warm-gray">{ex.muscle_group}{ex.gif_id ? ` · ${A.gifPinned}` : ""}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                {ex.gif_id && (
                  <button onClick={() => pick(ex.id, "")} className="text-[0.78rem] font-semibold text-warm-gray border border-sand px-3 py-1.5 rounded-full hover:bg-sand">{A.gifReset}</button>
                )}
                <button onClick={() => (openId === ex.id ? setOpenId(null) : openEditor(ex))} className="text-[0.78rem] font-semibold text-forest border border-sage-light px-3 py-1.5 rounded-full hover:bg-sage-light/40">{A.gifChange}</button>
              </div>
            </div>

            {openId === ex.id && (
              <div className="mt-4 border-t border-sand pt-4">
                <div className="flex gap-2 mb-3">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search(q)}
                    placeholder={A.gifSearchPh}
                    className="flex-1 px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white"
                  />
                  <button onClick={() => search(q)} disabled={searching} className="text-[0.82rem] font-semibold text-white bg-terracotta px-4 py-2 rounded-full hover:bg-terracotta-dark disabled:opacity-60 shrink-0">
                    {searching ? "…" : A.gifSearch}
                  </button>
                </div>
                {results === null ? (
                  <p className="text-warm-gray text-[0.85rem]">…</p>
                ) : results.length === 0 ? (
                  <p className="text-warm-gray text-[0.85rem]">{A.gifNoResults}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {results.map((r) => {
                      const chosen = ex.gif_id === r.id;
                      return (
                        <button key={r.id} onClick={() => pick(ex.id, r.id)} className={`border rounded-xl p-2 text-left transition-colors ${chosen ? "border-terracotta bg-terracotta/5" : "border-sand hover:border-terracotta"}`}>
                          <img src={gifSrc(r.id)} alt={r.name} loading="lazy" className="w-full aspect-square object-contain rounded-lg bg-cream mb-1" />
                          <div className="text-[0.72rem] font-medium text-charcoal capitalize leading-tight">{r.name}</div>
                          <div className="text-[0.66rem] text-warm-gray capitalize">{r.target} · {r.equipment}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
