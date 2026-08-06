import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { Button, Input, Textarea, Field } from "./ui";

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`text-[2rem] leading-none transition-colors ${(hover || value) >= n ? "text-gold" : "text-sand"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function FeedbackForm() {
  const { t, lang } = useLanguage();
  const f = t.feedback;
  const [form, setForm] = useState({ name: "", detail: "", email: "", comment: "" });
  const [rating, setRating] = useState(5);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) {
      setError(f.consentRequired);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, detail: form.detail, email: form.email, rating, text: form.comment, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 relative z-[1] py-16">
      <Link to="/" className="font-display text-2xl font-semibold text-forest tracking-tight mb-8">
        Lift<span className="text-terracotta">&amp;</span>Inspire
      </Link>
      <div className="w-full max-w-[520px] bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
        {sent ? (
          <div className="text-center py-6">
            <h1 className="font-display text-[1.8rem] font-semibold text-charcoal mb-2">{f.thanksTitle}</h1>
            <p className="text-[0.92rem] text-warm-gray mb-8">{f.thanksSub}</p>
            <Button as={Link} to="/">{f.backHome}</Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-[clamp(1.7rem,4vw,2.2rem)] font-semibold text-charcoal mb-2 leading-tight">
              {f.title1}
              <em className="italic text-terracotta">{f.titleEm}</em>
            </h1>
            <p className="text-[0.9rem] text-warm-gray mb-7 leading-relaxed">{f.sub}</p>

            <form onSubmit={submit}>
              <div className="mb-5">
                <label className="block text-[0.8rem] font-semibold text-charcoal mb-2">{f.rating}</label>
                <StarRating value={rating} onChange={setRating} />
              </div>

              <div className="mb-4">
                <Field label={f.name}>
                  <Input type="text" value={form.name} onChange={update("name")} placeholder={f.namePh} />
                </Field>
              </div>
              <div className="mb-4">
                <Field label={f.detail}>
                  <Input type="text" value={form.detail} onChange={update("detail")} placeholder={f.detailPh} />
                </Field>
              </div>
              <div className="mb-4">
                <Field label={f.comment}>
                  <Textarea rows={5} value={form.comment} onChange={update("comment")} placeholder={f.commentPh} />
                </Field>
              </div>
              <div className="mb-5">
                <Field label={f.email}>
                  <Input type="email" value={form.email} onChange={update("email")} placeholder={f.emailPh} autoComplete="email" />
                </Field>
              </div>

              <label className="flex items-start gap-2.5 mb-6 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-terracotta shrink-0" />
                <span className="text-[0.82rem] text-warm-gray leading-snug">{f.consent}</span>
              </label>

              <Button type="submit" disabled={busy} size="lg" className="w-full">
                {busy ? f.sending : f.submit}
              </Button>
              {error && <p className="text-center text-[0.82rem] text-red-500 mt-4">{error}</p>}
            </form>

            <p className="text-center text-[0.85rem] text-warm-gray mt-6">
              <Link to="/" className="text-terracotta font-semibold hover:text-terracotta-dark">{f.backHome}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
