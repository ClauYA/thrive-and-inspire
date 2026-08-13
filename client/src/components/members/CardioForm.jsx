import { useState } from "react";
import { userApi } from "../../lib/userApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { CARDIO_TYPES, cardioTypeInfo } from "../../lib/cardioTypes";
import CardioIcon from "./CardioIcon";

const today = () => new Date().toISOString().slice(0, 10);

// Inline cardio logger: pick a type, enter duration/distance/HR/RPE, save.
// Reused inline in the workout logger (mixed & solo-cardio days) and inside
// CardioModal for the quick "log cardio" button on the dashboard.
export default function CardioForm({ coachNote, planId, onSaved }) {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const [type, setType] = useState("");
  const [date, setDate] = useState(today());
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [unit, setUnit] = useState("km");
  const [hr, setHr] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white";

  const save = async () => {
    if (!type) { setError(tr.cardioPickType); return; }
    setSaving(true);
    setError("");
    try {
      await userApi("/api/cardio", "POST", {
        type, performedAt: date || null, durationMin: duration, distance,
        distanceUnit: unit, avgHr: hr, rpe, notes, planId: planId || null,
      });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      {coachNote ? (
        <div className="flex items-start gap-2 bg-sage-light/30 border border-sage-light rounded-xl px-3 py-2">
          <span>📋</span>
          <div>
            <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-forest">{tr.cardioCoachNote}</div>
            <div className="text-[0.82rem] text-charcoal whitespace-pre-line">{coachNote}</div>
          </div>
        </div>
      ) : null}

      <div>
        <label className="block text-[0.8rem] font-semibold text-charcoal mb-2">{tr.cardioType}</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {CARDIO_TYPES.map((c) => {
            const info = cardioTypeInfo(c.key, lang);
            const on = type === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => { setType(c.key); setSaved(false); }}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border transition-colors ${on ? "bg-terracotta text-white border-terracotta" : "bg-white text-charcoal border-sand hover:border-terracotta"}`}
              >
                <CardioIcon type={c.key} className="w-6 h-6" />
                <span className="text-[0.72rem] font-medium text-center leading-tight">{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.cardioDuration}</label>
          <input type="number" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="20" className={inputCls} />
        </div>
        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.date}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.cardioDistance}</label>
          <div className="flex gap-1.5">
            <input type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5" className={inputCls} />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="px-2 border-[1.5px] border-sand rounded-xl bg-cream text-[0.85rem]">
              <option value="km">km</option>
              <option value="mi">mi</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.cardioHr}</label>
          <input type="number" inputMode="numeric" value={hr} onChange={(e) => setHr(e.target.value)} placeholder="130" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.cardioRpe}</label>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button key={n} type="button" onClick={() => setRpe(String(n))} className={`w-8 h-8 rounded-full text-[0.8rem] font-semibold border transition-colors ${String(rpe) === String(n) ? "bg-forest text-white border-forest" : "bg-white text-charcoal border-sand"}`}>{n}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.notes}</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </div>

      {error && <p className="text-red-500 text-[0.82rem]">{error}</p>}
      <button
        onClick={save}
        disabled={saving || saved}
        className={`w-full font-semibold py-3 rounded-full transition-colors disabled:opacity-70 ${saved ? "bg-forest text-white" : "bg-terracotta text-white hover:bg-terracotta-dark"}`}
      >
        {saving ? "…" : saved ? `✓ ${tr.cardioSaved}` : tr.cardioSave}
      </button>
    </div>
  );
}
