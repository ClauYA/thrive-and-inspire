import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";
import { Button } from "./ui";

/* ──────────────────────────────────────────────────────────────
   ⬇️  PEGA AQUÍ TUS DATOS DE PAGO  ⬇️
   1. STRIPE_PAYMENT_LINK: crea un "Payment Link" en tu panel de Stripe
      (Productos → Payment Links) y pega aquí la URL (empieza con
      https://buy.stripe.com/...).
   2. VENMO_USERNAME: tu usuario de Venmo, SIN la @.
   3. PAYMENT_AMOUNT: opcional, el monto para prellenar Venmo (ej. "150").
   ────────────────────────────────────────────────────────────── */
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_7sY9AV6Wu3WY4VM6f15EY00";
const VENMO_USERNAME = "ClauYA";
const PAYMENT_AMOUNT = "";

/* ──────────────────────────────────────────────────────────────
   ⬇️  PEGA AQUÍ TU ENLACE DE CALENDLY  ⬇️
   En tu panel de Calendly, abre el tipo de evento de la videollamada
   introductoria → "Share" → copia el enlace (https://calendly.com/...).
   ────────────────────────────────────────────────────────────── */
const CALENDLY_URL = "https://calendly.com/cyabittner/30min";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  goals: [],
  format: "",
  location: "",
  weight: "",
  weightUnit: "kg",
  height: "",
  heightUnit: "cm",
  coachedBefore: "",
  experience: "",
  message: "",
};

const selectArrow =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6560' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")";

function buildVenmoLink(note) {
  const params = new URLSearchParams({ txn: "pay", recipients: VENMO_USERNAME, note });
  if (PAYMENT_AMOUNT) params.set("amount", PAYMENT_AMOUNT);
  return `https://venmo.com/?${params.toString()}`;
}

export default function ReadyPage() {
  const { t, toggle } = useLanguage();
  const r = t.ready;
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleGoal = (goal) =>
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.firstName.trim()) {
      setStatus("error");
      setErrorMsg(r.validation);
      return;
    }

    setStatus("sending");
    setErrorMsg("");
    // Merge each measurement with its unit, and drop the unit-only fields.
    const { weightUnit, heightUnit, ...rest } = form;
    const payload = {
      ...rest,
      weight: form.weight.trim() ? `${form.weight.trim()} ${weightUnit}` : "",
      height: form.height.trim() ? `${form.height.trim()} ${heightUnit}` : "",
    };
    try {
      const res = await fetch("/api/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(r.error);
    }
  };

  const inputClass =
    "w-full px-[18px] py-3.5 border-[1.5px] border-sand rounded-2xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";
  const selectClass = `${inputClass} appearance-none cursor-pointer bg-no-repeat`;
  const selectStyle = { backgroundImage: selectArrow, backgroundPosition: "right 16px center" };

  // Ask for a city only when in-person is involved (options 1 = in person, 2 = mixed).
  const needsLocation = form.format === r.formatOptions[1] || form.format === r.formatOptions[2];

  return (
    <div className="relative z-[1] min-h-screen flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-[5%] py-5 border-b border-light-gray/30 bg-cream/80 backdrop-blur-md">
        <Link to="/" className="font-display text-2xl font-semibold text-forest tracking-tight">
          Lift<span className="text-terracotta">&amp;</span>Inspire
        </Link>
        <button
          onClick={toggle}
          className="bg-transparent border-[1.5px] border-sage-light text-forest px-4 py-2 rounded-full text-[0.82rem] font-semibold hover:bg-forest hover:text-white hover:border-forest transition-all"
        >
          🌐 {t.nav.langLabel}
        </button>
      </header>

      <main
        className="flex-1"
        style={{ background: "linear-gradient(165deg, var(--color-cream) 0%, var(--color-sand) 100%)" }}
      >
        <div className="max-w-[720px] mx-auto px-[5%] py-16 sm:py-24">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[0.85rem] text-warm-gray hover:text-forest transition-colors mb-8"
            >
              ← {r.back}
            </Link>
            <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
              {r.label}
            </div>
            <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-6">
              {r.title1}
              <em className="italic text-terracotta">{r.titleEm}</em>
            </h1>

            {/* Important information box */}
            <div className="bg-sage/10 border border-sage-light rounded-[20px] p-6 sm:p-7 mb-10">
              <h2 className="font-display text-[1.3rem] font-semibold text-forest mb-3">{r.infoTitle}</h2>
              <p className="text-[0.9rem] text-warm-gray leading-[1.7] mb-4">{r.infoP1}</p>
              <p className="text-[0.9rem] font-semibold text-charcoal mb-1.5">{r.infoWhy}</p>
              <p className="text-[0.9rem] text-warm-gray leading-[1.7] mb-3">{r.infoP2}</p>
              <p className="text-[0.9rem] text-warm-gray leading-[1.7]">{r.infoP3}</p>
            </div>
          </Reveal>

          {status === "success" ? (
            /* ── Payment step ── */
            <Reveal>
              <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)] text-center">
                <div className="font-display text-[1.8rem] font-semibold text-forest mb-2">{r.success}</div>
                <p className="text-[0.92rem] text-warm-gray leading-[1.7] mb-8">{r.successNote}</p>

                {/* Schedule the first video call via Calendly (opens in a new tab) */}
                <div className="border-t border-sand pt-8 mb-8">
                  <div className="font-display text-[1.4rem] font-semibold text-charcoal mb-2">{r.schedTitle}</div>
                  <p className="text-[0.88rem] text-warm-gray mb-6">{r.schedSub}</p>
                  <Button as="a" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" variant="forest">
                    📅 {r.schedBtn}
                  </Button>
                </div>

                <div className="border-t border-sand pt-8">
                  <div className="font-display text-[1.4rem] font-semibold text-charcoal mb-2">{r.payTitle}</div>
                  <p className="text-[0.88rem] text-warm-gray mb-6">{r.payP}</p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button as="a" href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="w-full">
                      💳 {r.payStripe}
                    </Button>
                    <a
                      href={buildVenmoLink("Asesoria Lift & Inspire")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-4 rounded-full text-[0.95rem] font-semibold text-white bg-[#008CFF] hover:brightness-95 hover:-translate-y-0.5 transition-all shadow-[0_8px_24px_rgba(0,140,255,0.25)]"
                    >
                      Venmo
                    </a>
                  </div>

                  <p className="text-[0.8rem] text-warm-gray mt-6">{r.payNote}</p>
                </div>
              </div>
            </Reveal>
          ) : (
            /* ── Intake form ── */
            <Reveal delay={0.1}>
              <form onSubmit={handleSubmit} className="bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label htmlFor="firstName" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.firstName}</label>
                    <input id="firstName" type="text" value={form.firstName} onChange={update("firstName")} placeholder={r.firstNamePh} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.lastName}</label>
                    <input id="lastName" type="text" value={form.lastName} onChange={update("lastName")} placeholder={r.lastNamePh} className={inputClass} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label htmlFor="email" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.email}</label>
                    <input id="email" type="email" value={form.email} onChange={update("email")} placeholder={r.emailPh} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.phone}</label>
                    <input id="phone" type="tel" value={form.phone} onChange={update("phone")} placeholder={r.phonePh} className={inputClass} />
                  </div>
                </div>

                {/* Goals — multi-select chips */}
                <div className="mb-5">
                  <span className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.goals}</span>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {r.goalOptions.map((goal) => {
                      const selected = form.goals.includes(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleGoal(goal)}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border-[1.5px] text-left text-[0.85rem] transition-all ${
                            selected
                              ? "border-terracotta bg-terracotta/5 text-charcoal font-medium"
                              : "border-sand bg-cream text-warm-gray hover:border-sage-light"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md border-[1.5px] shrink-0 flex items-center justify-center text-white text-[0.7rem] ${
                              selected ? "bg-terracotta border-terracotta" : "border-light-gray"
                            }`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Coaching format + (conditional) location */}
                <div className="mb-5">
                  <label htmlFor="format" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.format}</label>
                  <select id="format" value={form.format} onChange={update("format")} className={selectClass} style={selectStyle}>
                    <option value="" disabled>{r.formatPh}</option>
                    {r.formatOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <p className="text-[0.78rem] text-forest mt-2">{r.formatNote}</p>
                </div>

                {needsLocation && (
                  <div className="mb-5">
                    <label htmlFor="location" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.location}</label>
                    <input id="location" type="text" value={form.location} onChange={update("location")} placeholder={r.locationPh} className={inputClass} />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label htmlFor="weight" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.weight}</label>
                    <div className="flex gap-2">
                      <input id="weight" type="number" inputMode="decimal" min="0" value={form.weight} onChange={update("weight")} placeholder={r.weightPh} className={`${inputClass} flex-1 min-w-0`} />
                      <select aria-label={r.weight} value={form.weightUnit} onChange={update("weightUnit")} className={`${selectClass} shrink-0 w-[84px]!`} style={selectStyle}>
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="height" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.height}</label>
                    <div className="flex gap-2">
                      <input id="height" type="number" inputMode="decimal" min="0" value={form.height} onChange={update("height")} placeholder={r.heightPh} className={`${inputClass} flex-1 min-w-0`} />
                      <select aria-label={r.height} value={form.heightUnit} onChange={update("heightUnit")} className={`${selectClass} shrink-0 w-[84px]!`} style={selectStyle}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="coachedBefore" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.coachedBefore}</label>
                  <select id="coachedBefore" value={form.coachedBefore} onChange={update("coachedBefore")} className={selectClass} style={selectStyle}>
                    <option value="" disabled>{r.coachedPh}</option>
                    {r.coachedOptions.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="mb-5">
                  <label htmlFor="experience" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.experience}</label>
                  <textarea id="experience" rows="3" value={form.experience} onChange={update("experience")} placeholder={r.experiencePh} className={`${inputClass} resize-none`} />
                </div>

                <div className="mb-5">
                  <label htmlFor="message" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{r.message}</label>
                  <textarea id="message" rows="3" value={form.message} onChange={update("message")} placeholder={r.messagePh} className={`${inputClass} resize-none`} />
                </div>

                <Button type="submit" disabled={status === "sending"} size="lg" className="w-full mt-2">
                  {status === "sending" ? r.submitting : r.submit}
                </Button>

                {status === "error" && <p className="text-center text-[0.82rem] text-red-500 mt-3">{errorMsg}</p>}
                <p className="text-center text-[0.78rem] text-light-gray mt-3.5">{r.note}</p>
              </form>
            </Reveal>
          )}
        </div>
      </main>
    </div>
  );
}
