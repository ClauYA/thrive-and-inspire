import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";
import { Button } from "../ui";

const todayStr = () => new Date().toISOString().slice(0, 10);
const inputClass =
  "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all focus:border-terracotta-light focus:bg-white";
const round = (n) => Math.round(Number(n) || 0);

export default function Nutrition() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();

  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null); // null = no search yet
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null); // { id, name, servings, servingIdx, qty }
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadLog = useCallback(async () => {
    try {
      const d = await userApi(`/api/nutrition/log?date=${date}`);
      setEntries(d.entries || []);
      setTotals(d.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    }
  }, [date, navigate]);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    loadLog();
  }, [loadLog, navigate]);

  const search = async (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    setError("");
    setSelected(null);
    try {
      const d = await userApi(`/api/nutrition/search?q=${encodeURIComponent(q.trim())}`);
      setResults(d.foods || []);
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickFood = async (food) => {
    setError("");
    try {
      const d = await userApi(`/api/nutrition/food/${food.id}`);
      const servings = d.food.servings || [];
      setSelected({ id: d.food.id, name: d.food.name, brand: d.food.brand, servings, servingIdx: 0, qty: 1 });
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    }
  };

  const serving = selected ? selected.servings[selected.servingIdx] : null;
  const scaled = serving
    ? {
        calories: serving.calories * selected.qty,
        protein: serving.protein * selected.qty,
        carbs: serving.carbs * selected.qty,
        fat: serving.fat * selected.qty,
      }
    : null;

  const addFood = async () => {
    if (!selected || !serving) return;
    setBusy(true);
    setError("");
    try {
      await userApi("/api/nutrition/log", "POST", {
        date,
        foodName: selected.name,
        serving: `${selected.qty} × ${serving.description}`,
        quantity: selected.qty,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        foodId: selected.id,
      });
      setSelected(null);
      setResults(null);
      setQ("");
      await loadLog();
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeEntry = async (id) => {
    try {
      await userApi(`/api/nutrition/log/${id}`, "DELETE");
      await loadLog();
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    }
  };

  const macro = (label, val, unit = "g") => (
    <div className="text-center">
      <div className="font-display text-[1.3rem] font-semibold text-charcoal">{round(val)}{unit === "g" ? "g" : ""}</div>
      <div className="text-[0.68rem] uppercase tracking-[0.08em] text-warm-gray">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[760px] mx-auto px-[5%] py-10">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="font-display text-[2rem] font-semibold text-charcoal">{tr.nutTitle}</h1>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} max-w-[180px]`} />
        </div>

        {/* Daily totals */}
        <div className="bg-forest text-white rounded-2xl p-5 sm:p-6 mb-6">
          <div className="text-[0.72rem] uppercase tracking-[0.12em] text-sage-light mb-3">{tr.nutToday}</div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="font-display text-[1.6rem] font-semibold">{round(totals.calories)}</div>
              <div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutCalories}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-[1.6rem] font-semibold">{round(totals.protein)}g</div>
              <div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutProtein}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-[1.6rem] font-semibold">{round(totals.carbs)}g</div>
              <div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutCarbs}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-[1.6rem] font-semibold">{round(totals.fat)}g</div>
              <div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutFat}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={search} className="flex gap-2 mb-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr.nutSearchPh} className={inputClass} />
          <Button type="submit" size="sm" disabled={searching} className="whitespace-nowrap">
            {searching ? tr.nutSearching : tr.nutSearchBtn}
          </Button>
        </form>

        {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

        {/* Search results */}
        {results !== null && !selected && (
          <div className="bg-white rounded-2xl border border-sand mb-6 overflow-hidden">
            {results.length === 0 ? (
              <p className="text-warm-gray text-[0.88rem] p-4">{tr.nutNoResults}</p>
            ) : (
              <ul className="divide-y divide-sand/60">
                {results.map((f) => (
                  <li key={f.id}>
                    <button onClick={() => pickFood(f)} className="w-full text-left px-4 py-3 hover:bg-cream/60 transition-colors">
                      <span className="text-[0.9rem] font-medium text-charcoal block">{f.name}{f.brand ? ` · ${f.brand}` : ""}</span>
                      {f.description && <span className="text-[0.76rem] text-warm-gray">{f.description}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Selected food: choose serving + quantity */}
        {selected && (
          <div className="bg-white rounded-2xl border border-terracotta/40 p-5 mb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-charcoal">{selected.name}{selected.brand ? ` · ${selected.brand}` : ""}</h3>
              <button onClick={() => setSelected(null)} className="text-warm-gray hover:text-charcoal text-xl leading-none">×</button>
            </div>
            <div className="grid sm:grid-cols-[1fr_90px] gap-3 mb-4">
              <div>
                <label className="block text-[0.78rem] font-semibold text-charcoal mb-1.5">{tr.nutServing}</label>
                <select
                  value={selected.servingIdx}
                  onChange={(e) => setSelected((s) => ({ ...s, servingIdx: Number(e.target.value) }))}
                  className={`${inputClass} cursor-pointer`}
                >
                  {selected.servings.map((s, i) => (
                    <option key={s.id || i} value={i}>{s.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[0.78rem] font-semibold text-charcoal mb-1.5">{tr.nutQuantity}</label>
                <input
                  type="number" min="0.25" step="0.25" value={selected.qty}
                  onChange={(e) => setSelected((s) => ({ ...s, qty: Number(e.target.value) || 0 }))}
                  className={inputClass}
                />
              </div>
            </div>
            {scaled && (
              <div className="grid grid-cols-4 gap-2 bg-cream rounded-xl p-3 mb-4">
                {macro(tr.nutCalories, scaled.calories, "kcal")}
                {macro(tr.nutProtein, scaled.protein)}
                {macro(tr.nutCarbs, scaled.carbs)}
                {macro(tr.nutFat, scaled.fat)}
              </div>
            )}
            <Button onClick={addFood} disabled={busy} className="w-full">
              {busy ? tr.saving : `+ ${tr.nutAdd}`}
            </Button>
          </div>
        )}

        {/* Logged foods */}
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-warm-gray mb-3">{tr.nutLogFood}</h2>
        {entries.length === 0 ? (
          <p className="text-warm-gray text-[0.88rem]">{tr.nutNoEntries}</p>
        ) : (
          <div className="grid gap-2">
            {entries.map((en) => (
              <div key={en.id} className="bg-white rounded-xl border border-sand px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[0.9rem] font-medium text-charcoal truncate">{en.food_name}</div>
                  <div className="text-[0.74rem] text-warm-gray">
                    {en.serving ? `${en.serving} · ` : ""}{round(en.calories)} kcal · P{round(en.protein)} C{round(en.carbs)} G{round(en.fat)}
                  </div>
                </div>
                <button onClick={() => removeEntry(en.id)} aria-label={tr.nutRemove} className="shrink-0 text-warm-gray hover:text-red-500 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
