import { useState } from "react";
import { userApi } from "../../lib/userApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { CARDIO_TYPES, cardioTypeInfo } from "../../lib/cardioTypes";

const today = () => new Date().toISOString().slice(0, 10);

// Quick cardio logger: pick a type, enter duration/distance/HR/RPE, save.
export default function CardioModal({ open, onClose, onSaved, planId, coachNote }) {
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
  const [error, setError] = useState("");

  if (!open) return null;

  const save = async () => {
    if (!type) { setError(tr.cardioPickType); return; }
    setSaving(true);
    setError("");
    try {
      await userApi("/api/cardio", "POST", {
        type, performedAt: date || null, durationMin: duration, distance,
        distanceUnit: unit, avgHr: hr, rpe, notes, planId: planId || null,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white";

  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full sm:max-w-[520px] bg-cream rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-sand">
          <span className="font-display text-[1.3rem] font-semibold text-charcoal">🏃 {tr.cardioLogTitle}</span>
          <button onClick={onClose} aria-label={tr.videoClose} className="w-9 h-9 rounded-full flex items-center justify-center text-warm-gray hover:bg-sand text-2xl leading-none">×</button>
        </div>
        <div className="p-5 grid gap-4">
          {coachNote ? (
            <div className="flex items-start gap-2 bg-sage-light/30 border border-sage-light rounded-xl px-3 py-2">
              <span>📋</span>
              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-forest">{tr.cardioLabel}</div>
                <div className="text-[0.82rem] text-charcoal whitespace-pre-line">{coachNote}</div>
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{tr.cardioType}</label>
            <div className="flex flex-wrap gap-2">
              {CARDIO_TYPES.map((c) => {
                const info = cardioTypeInfo(c.key, lang);
                const on = type === c.key;
                return (
                  <button key={c.key} type="button" onClick={() => setType(c.key)} className={`text-[0.8rem] font-medium px-3 py-1.5 rounded-full border transition-colors ${on ? "bg-terracotta text-white border-terracotta" : "bg-white text-charcoal border-sand hover:border-terracotta"}`}>
                    {c.icon} {info.label}
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
          <button onClick={save} disabled={saving} className="w-full bg-terracotta text-white font-semibold py-3 rounded-full hover:bg-terracotta-dark disabled:opacity-60">
            {saving ? "…" : tr.cardioSave}
          </button>
        </div>
      </div>
    </div>
  );
}
