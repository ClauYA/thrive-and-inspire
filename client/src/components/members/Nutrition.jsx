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
const DEFAULT_MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default function Nutrition() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();

  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [savedMeals, setSavedMeals] = useState([]);
  const [extraMeals, setExtraMeals] = useState([]); // custom meals added this session
  const [activeMeal, setActiveMeal] = useState(null); // meal whose add-food panel is open
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mealLabel = (key) =>
    ({ breakfast: tr.mealBreakfast, lunch: tr.mealLunch, dinner: tr.mealDinner, snack: tr.mealSnack }[key] || key);

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

  const loadSaved = useCallback(async () => {
    try {
      const d = await userApi("/api/nutrition/meals");
      setSavedMeals(d.meals || []);
    } catch {
      /* saved meals are optional */
    }
  }, []);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    loadLog();
    loadSaved();
  }, [loadLog, loadSaved, navigate]);

  // ── Food search ──
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
      setSelected({ id: d.food.id, name: d.food.name, brand: d.food.brand, servings, servingIdx: 0, amount: servings[0]?.numberOfUnits || 1 });
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    }
  };

  const serving = selected ? selected.servings[selected.servingIdx] : null;
  const baseUnits = serving ? serving.numberOfUnits || 1 : 1;
  const multiplier = serving ? (Number(selected.amount) || 0) / baseUnits : 0;
  const scaled = serving
    ? { calories: serving.calories * multiplier, protein: serving.protein * multiplier, carbs: serving.carbs * multiplier, fat: serving.fat * multiplier }
    : null;

  const logItem = (meal, item) =>
    userApi("/api/nutrition/log", "POST", {
      date, meal,
      foodName: item.foodName, serving: item.serving, quantity: item.quantity,
      calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, foodId: item.foodId,
    });

  const addFood = async () => {
    if (!selected || !serving || !activeMeal) return;
    setBusy(true);
    setError("");
    try {
      const servingText = serving.unit ? `${selected.amount} ${serving.unit}` : `${selected.amount} × ${serving.description}`;
      await logItem(activeMeal, {
        foodName: selected.name, serving: servingText, quantity: Number(selected.amount) || 0,
        calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, foodId: selected.id,
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

  const addMeal = () => {
    const name = window.prompt(tr.nutNewMealPrompt);
    if (!name || !name.trim()) return;
    const key = name.trim();
    setExtraMeals((m) => (m.includes(key) ? m : [...m, key]));
    setActiveMeal(key);
  };

  const saveMeal = async (meal, mealEntries) => {
    const name = window.prompt(tr.nutSaveMealPrompt, mealLabel(meal));
    if (!name || !name.trim()) return;
    try {
      await userApi("/api/nutrition/meals", "POST", {
        name: name.trim(),
        items: mealEntries.map((en) => ({
          foodName: en.food_name, serving: en.serving, quantity: en.quantity,
          calories: en.calories, protein: en.protein, carbs: en.carbs, fat: en.fat,
        })),
      });
      await loadSaved();
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    }
  };

  const applySaved = async (sm) => {
    if (!activeMeal) return;
    setBusy(true);
    setError("");
    try {
      for (const it of sm.items) {
        await logItem(activeMeal, {
          foodName: it.food_name, serving: it.serving, quantity: it.quantity,
          calories: it.calories, protein: it.protein, carbs: it.carbs, fat: it.fat, foodId: it.fs_food_id,
        });
      }
      await loadLog();
    } catch (err) {
      if (err.unauthorized) return navigate("/login");
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openAdd = (meal) => {
    setActiveMeal(meal);
    setQ("");
    setResults(null);
    setSelected(null);
  };

  // Visible meals: defaults + any custom meals (session-added or already logged).
  const meals = [...DEFAULT_MEALS];
  [...extraMeals, ...entries.map((e) => e.meal)].forEach((m) => {
    if (m && !meals.includes(m)) meals.push(m);
  });

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
            <div className="text-center"><div className="font-display text-[1.6rem] font-semibold">{round(totals.calories)}</div><div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutCalories}</div></div>
            <div className="text-center"><div className="font-display text-[1.6rem] font-semibold">{round(totals.protein)}g</div><div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutProtein}</div></div>
            <div className="text-center"><div className="font-display text-[1.6rem] font-semibold">{round(totals.carbs)}g</div><div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutCarbs}</div></div>
            <div className="text-center"><div className="font-display text-[1.6rem] font-semibold">{round(totals.fat)}g</div><div className="text-[0.68rem] uppercase tracking-[0.08em] text-white/60">{tr.nutFat}</div></div>
          </div>
        </div>

        {error && <p className="text-red-500 text-[0.85rem] mb-3">{error}</p>}

        {/* Meals */}
        {meals.map((meal) => {
          const mealEntries = entries.filter((e) => e.meal === meal);
          const sub = mealEntries.reduce((s, e) => s + Number(e.calories), 0);
          return (
            <div key={meal} className="bg-white rounded-2xl border border-sand p-4 sm:p-5 mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-semibold text-charcoal capitalize">{mealLabel(meal)}</h3>
                <span className="text-[0.8rem] text-warm-gray shrink-0">{round(sub)} kcal</span>
              </div>

              {mealEntries.length === 0 ? (
                <p className="text-[0.8rem] text-warm-gray mb-2">{tr.nutEmptyMeal}</p>
              ) : (
                <div className="grid gap-1.5 mb-2">
                  {mealEntries.map((en) => (
                    <div key={en.id} className="flex items-center justify-between gap-3 border border-sand rounded-xl px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-[0.88rem] font-medium text-charcoal truncate">{en.food_name}</div>
                        <div className="text-[0.72rem] text-warm-gray">{en.serving ? `${en.serving} · ` : ""}{round(en.calories)} kcal · P{round(en.protein)} C{round(en.carbs)} G{round(en.fat)}</div>
                      </div>
                      <button onClick={() => removeEntry(en.id)} aria-label={tr.nutRemove} className="shrink-0 text-warm-gray hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {activeMeal !== meal && (
                  <button onClick={() => openAdd(meal)} className="text-[0.82rem] font-semibold text-terracotta hover:text-terracotta-dark">
                    + {tr.nutAddFood}
                  </button>
                )}
                {mealEntries.length > 0 && (
                  <button onClick={() => saveMeal(meal, mealEntries)} className="text-[0.82rem] font-semibold text-forest hover:text-forest/80">
                    💾 {tr.nutSaveMeal}
                  </button>
                )}
              </div>

              {/* Inline add-food panel for this meal */}
              {activeMeal === meal && (
                <div className="mt-3 border-t border-sand pt-3">
                  {savedMeals.length > 0 && !selected && (
                    <div className="mb-3">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-warm-gray mb-1.5">{tr.nutSavedMeals}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {savedMeals.map((sm) => (
                          <button key={sm.id} onClick={() => applySaved(sm)} disabled={busy} className="text-[0.78rem] font-medium border border-sage-light bg-sage-light/20 text-forest px-3 py-1.5 rounded-full hover:bg-sage-light/40">
                            + {sm.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={search} className="flex gap-2 mb-3">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr.nutSearchPh} className={inputClass} />
                    <Button type="submit" size="sm" disabled={searching} className="whitespace-nowrap">{searching ? tr.nutSearching : tr.nutSearchBtn}</Button>
                  </form>

                  {results !== null && !selected && (
                    results.length === 0 ? (
                      <p className="text-warm-gray text-[0.86rem] mb-3">{tr.nutNoResults}</p>
                    ) : (
                      <ul className="divide-y divide-sand/60 border border-sand rounded-xl mb-3 max-h-[260px] overflow-y-auto">
                        {results.map((f) => (
                          <li key={f.id}>
                            <button onClick={() => pickFood(f)} className="w-full text-left px-3 py-2 hover:bg-cream/60">
                              <span className="text-[0.88rem] font-medium text-charcoal block">{f.name}{f.brand ? ` · ${f.brand}` : ""}</span>
                              {f.description && <span className="text-[0.74rem] text-warm-gray">{f.description}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )
                  )}

                  {selected && (
                    <div className="bg-cream/60 rounded-xl p-3 mb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-charcoal text-[0.9rem]">{selected.name}{selected.brand ? ` · ${selected.brand}` : ""}</h4>
                        <button onClick={() => setSelected(null)} className="text-warm-gray hover:text-charcoal text-lg leading-none">×</button>
                      </div>
                      <div className="grid grid-cols-[1fr_120px] gap-2 mb-3">
                        <div>
                          <label className="block text-[0.74rem] font-semibold text-charcoal mb-1">{tr.nutServing}</label>
                          <select value={selected.servingIdx} onChange={(e) => { const idx = Number(e.target.value); setSelected((s) => ({ ...s, servingIdx: idx, amount: s.servings[idx]?.numberOfUnits || 1 })); }} className={`${inputClass} cursor-pointer`}>
                            {selected.servings.map((s, i) => (<option key={s.id || i} value={i}>{s.description}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[0.74rem] font-semibold text-charcoal mb-1">{tr.nutAmount}{serving?.unit ? ` (${serving.unit})` : ""}</label>
                          <input type="number" min="0" step="any" value={selected.amount} onChange={(e) => setSelected((s) => ({ ...s, amount: e.target.value }))} className={inputClass} />
                        </div>
                      </div>
                      {scaled && (
                        <div className="grid grid-cols-4 gap-2 bg-white rounded-lg p-2 mb-3 text-center">
                          <div><div className="font-semibold text-charcoal">{round(scaled.calories)}</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutCalories}</div></div>
                          <div><div className="font-semibold text-charcoal">{round(scaled.protein)}g</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutProtein}</div></div>
                          <div><div className="font-semibold text-charcoal">{round(scaled.carbs)}g</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutCarbs}</div></div>
                          <div><div className="font-semibold text-charcoal">{round(scaled.fat)}g</div><div className="text-[0.62rem] uppercase text-warm-gray">{tr.nutFat}</div></div>
                        </div>
                      )}
                      <Button onClick={addFood} disabled={busy} size="sm" className="w-full">{busy ? tr.saving : `+ ${tr.nutAdd}`}</Button>
                    </div>
                  )}

                  <button onClick={() => setActiveMeal(null)} className="text-[0.8rem] font-semibold text-warm-gray hover:text-charcoal">{tr.nutDone}</button>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={addMeal} className="w-full border-2 border-dashed border-sage-light text-forest font-semibold py-3 rounded-2xl hover:bg-sage-light/20 transition-colors">
          + {tr.nutAddMeal}
        </button>
      </main>
    </div>
  );
}
