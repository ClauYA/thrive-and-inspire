import { useState } from "react";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  goal: "",
  obstacles: "",
  findUs: "",
};

const selectArrow =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6560' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")";

export default function ApplyForm() {
  const { t } = useLanguage();
  const a = t.apply;
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.firstName.trim()) {
      setStatus("error");
      setErrorMsg(a.validation);
      return;
    }

    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(a.error);
    }
  };

  const inputClass =
    "w-full px-[18px] py-3.5 border-[1.5px] border-sand rounded-2xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";
  const selectClass = `${inputClass} appearance-none cursor-pointer bg-no-repeat`;
  const selectStyle = { backgroundImage: selectArrow, backgroundPosition: "right 16px center" };

  return (
    <section
      id="apply"
      className="relative"
      style={{ background: "linear-gradient(165deg, var(--color-cream) 0%, var(--color-sand) 100%)" }}
    >
      <div className="max-w-[1100px] mx-auto px-[5%] py-24 grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-start">
        <Reveal>
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {a.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-6">
            {a.title1}
            <em className="italic text-terracotta">{a.titleEm}</em>
          </h2>
          <p className="text-[1.05rem] text-warm-gray max-w-[560px] leading-[1.75] font-light">{a.sub}</p>

          <ul className="list-none my-8 grid gap-3.5">
            {a.points.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-[0.9rem] text-warm-gray leading-[1.6]">
                <span className="text-terracotta text-[0.7rem] mt-1 shrink-0">✦</span>
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} className="bg-white rounded-[28px] p-8 sm:p-10 lg:py-12 shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
            <div className="font-display text-[1.8rem] font-semibold text-charcoal mb-2">{a.formTitle}</div>
            <div className="text-[0.85rem] text-warm-gray mb-8">{a.formSub}</div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label htmlFor="firstName" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.firstName}</label>
                <input id="firstName" type="text" value={form.firstName} onChange={update("firstName")} placeholder={a.firstNamePh} className={inputClass} />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.lastName}</label>
                <input id="lastName" type="text" value={form.lastName} onChange={update("lastName")} placeholder={a.lastNamePh} className={inputClass} />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.email}</label>
              <input id="email" type="email" value={form.email} onChange={update("email")} placeholder={a.emailPh} className={inputClass} />
            </div>

            <div className="mb-5">
              <label htmlFor="goal" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.goal}</label>
              <select id="goal" value={form.goal} onChange={update("goal")} className={selectClass} style={selectStyle}>
                <option value="" disabled>{a.goalPh}</option>
                {a.goals.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="obstacles" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.obstacles}</label>
              <textarea id="obstacles" rows="3" value={form.obstacles} onChange={update("obstacles")} placeholder={a.obstaclesPh} className={`${inputClass} resize-none`} />
            </div>

            <div className="mb-5">
              <label htmlFor="findUs" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.findUs}</label>
              <select id="findUs" value={form.findUs} onChange={update("findUs")} className={selectClass} style={selectStyle}>
                <option value="" disabled>{a.findUsPh}</option>
                {a.findUsOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={status === "sending" || status === "success"}
              className={`w-full py-4 rounded-full text-[1rem] font-semibold text-white transition-all mt-2 shadow-[0_8px_24px_rgba(196,113,74,0.3)] disabled:cursor-not-allowed ${
                status === "success" ? "bg-forest" : "bg-terracotta hover:bg-terracotta-dark hover:-translate-y-0.5"
              }`}
            >
              {status === "sending" ? a.submitting : status === "success" ? a.success : a.submit}
            </button>

            {status === "error" && <p className="text-center text-[0.82rem] text-red-500 mt-3">{errorMsg}</p>}
            <p className="text-center text-[0.78rem] text-light-gray mt-3.5">{a.note}</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
