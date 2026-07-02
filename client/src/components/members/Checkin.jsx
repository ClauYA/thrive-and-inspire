import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import { formatDate } from "../../lib/format";
import MemberHeader from "./MemberHeader";
import { Button } from "../ui";

const LB_PER_KG = 0.45359237;
const pad = (n) => String(n).padStart(2, "0");
// Monday of the current local week, as YYYY-MM-DD.
function currentWeekStart() {
  const x = new Date();
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

// Resize an image file to a compressed JPEG data URL (keeps the DB small, no storage needed).
function resizeImage(file, maxSize = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        const c = document.createElement("canvas");
        c.width = width; c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputClass = "w-full px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white";
const FACES = ["😣", "😕", "😐", "🙂", "😄"];

function Rating({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {FACES.map((f, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-11 h-11 rounded-full text-xl border transition-colors ${value === n ? "bg-terracotta/15 border-terracotta" : "bg-white border-sand hover:border-terracotta"}`}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

const EMPTY = {
  weight: "", neck: "", waist: "", abdomen: "", hips: "",
  armLeft: "", armRight: "", legLeft: "", legRight: "",
  photo: "", challenges: "",
  nutritionRating: 0, trainingRating: 0, stressLevel: 0, sleepLevel: 0,
};

export default function Checkin() {
  const { t, lang } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const weekStart = currentWeekStart();
  const [form, setForm] = useState(EMPTY);
  const [unit, setUnit] = useState("kg"); // weight input unit (stored value is kg)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const setRating = (f) => (n) => setForm((s) => ({ ...s, [f]: n }));

  const load = useCallback(async () => {
    try {
      const d = await userApi("/api/checkins");
      const wk = (d.checkins || []).find((c) => String(c.week_start).slice(0, 10) === weekStart);
      if (wk) {
        const u = wk.weight_unit === "lb" ? "lb" : "kg";
        setUnit(u);
        const shownWeight = wk.weight == null ? "" : (u === "lb" ? Math.round((wk.weight / LB_PER_KG) * 10) / 10 : wk.weight);
        setForm({
          weight: shownWeight, neck: wk.neck ?? "", waist: wk.waist ?? "", abdomen: wk.abdomen ?? "", hips: wk.hips ?? "",
          armLeft: wk.arm_left ?? "", armRight: wk.arm_right ?? "", legLeft: wk.leg_left ?? "", legRight: wk.leg_right ?? "",
          photo: wk.photo || "", challenges: wk.challenges || "",
          nutritionRating: wk.nutrition_rating || 0, trainingRating: wk.training_rating || 0,
          stressLevel: wk.stress_level || 0, sleepLevel: wk.sleep_level || 0,
        });
      }
    } catch (e) {
      if (e.unauthorized) navigate("/login");
    }
  }, [weekStart, navigate]);

  useEffect(() => {
    if (!getUserToken()) return navigate("/login");
    load();
  }, [load, navigate]);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setForm((s) => ({ ...s, photo: dataUrl }));
    } catch {
      setError(tr.ciPhotoError);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await userApi("/api/checkins", "POST", { weekStart, ...form, weightUnit: unit });
      setSaved(true);
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const measures = [
    ["neck", tr.ciNeck], ["waist", tr.ciWaist], ["abdomen", tr.ciAbdomen], ["hips", tr.ciHips],
    ["armLeft", tr.ciArmL], ["armRight", tr.ciArmR], ["legLeft", tr.ciLegL], ["legRight", tr.ciLegR],
  ];
  const ratings = [
    ["nutritionRating", tr.ciNutritionQ, tr.ciNutritionHint],
    ["trainingRating", tr.ciTrainingQ, ""],
    ["stressLevel", tr.ciStressQ, ""],
    ["sleepLevel", tr.ciSleepQ, ""],
  ];

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[680px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-4 hover:text-terracotta-dark">{tr.back}</button>
        <h1 className="font-display text-[2rem] font-semibold text-charcoal">{tr.ciTitle}</h1>
        <p className="text-[0.85rem] text-warm-gray mb-6">{tr.ciWeekOf} {formatDate(weekStart, lang)}</p>

        <div className="grid gap-5">
          {/* Weight */}
          <div className="bg-white rounded-2xl border border-sand p-5">
            <label className="block text-[0.82rem] font-semibold text-charcoal mb-1.5">{tr.ciWeightLabel}</label>
            <div className="flex items-center gap-2">
              <input type="number" inputMode="decimal" value={form.weight} onChange={set("weight")} className={`${inputClass} max-w-[140px]`} />
              <div className="flex gap-1">
                {["kg", "lb"].map((u) => (
                  <button key={u} type="button" onClick={() => setUnit(u)} className={`px-3 py-2 rounded-full text-[0.82rem] font-semibold border transition-colors ${unit === u ? "bg-terracotta text-white border-terracotta" : "bg-white text-warm-gray border-sand hover:border-terracotta"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="bg-white rounded-2xl border border-sand p-5">
            <div className="text-[0.82rem] font-semibold text-charcoal mb-3">{tr.ciMeasurements}</div>
            <div className="grid grid-cols-2 gap-3">
              {measures.map(([k, label]) => (
                <div key={k}>
                  <label className="block text-[0.74rem] text-warm-gray mb-1">{label}</label>
                  <input type="number" inputMode="decimal" value={form[k]} onChange={set(k)} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div className="bg-white rounded-2xl border border-sand p-5">
            <div className="text-[0.82rem] font-semibold text-charcoal mb-3">{tr.ciPhoto}</div>
            {form.photo && <img src={form.photo} alt="" className="w-40 h-40 object-cover rounded-xl mb-3 border border-sand" />}
            <label className="inline-block text-[0.82rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full cursor-pointer hover:bg-sage-light/40">
              📷 {tr.ciChoosePhoto}
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
          </div>

          {/* Ratings */}
          {ratings.map(([k, q, hint]) => (
            <div key={k} className="bg-white rounded-2xl border border-sand p-5">
              <label className="block text-[0.9rem] font-semibold text-charcoal mb-1">{q}</label>
              {hint && <p className="text-[0.76rem] text-warm-gray mb-3">{hint}</p>}
              <Rating value={form[k]} onChange={setRating(k)} />
            </div>
          ))}

          {/* Challenges */}
          <div className="bg-white rounded-2xl border border-sand p-5">
            <label className="block text-[0.9rem] font-semibold text-charcoal mb-2">{tr.ciChallenges}</label>
            <textarea rows="3" value={form.challenges} onChange={set("challenges")} className={`${inputClass} resize-none`} />
          </div>

          {error && <p className="text-red-500 text-[0.85rem]">{error}</p>}
          {saved && <p className="text-forest text-[0.85rem] font-semibold">✓ {tr.ciSaved}</p>}

          <div>
            <Button onClick={save} disabled={saving} size="lg">{saving ? tr.saving : tr.ciSave}</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
