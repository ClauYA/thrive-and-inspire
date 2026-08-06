import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { Button, Input, Field } from "../ui";

export default function ForgotPassword() {
  const { t, lang } = useLanguage();
  const a = t.auth;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
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
      <div className="w-full max-w-[400px] bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
        <h1 className="font-display text-[1.7rem] font-semibold text-charcoal mb-1.5">{a.forgotTitle}</h1>
        <p className="text-[0.85rem] text-warm-gray mb-6">{a.forgotSub}</p>

        {sent ? (
          <p className="text-[0.9rem] text-forest bg-sage-light/30 rounded-xl px-4 py-4 mb-2">{a.forgotSent}</p>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-5">
              <Field label={a.email}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={a.emailPh} autoComplete="username" />
              </Field>
            </div>
            <Button type="submit" disabled={busy} size="lg" className="w-full">
              {busy ? a.forgotSending : a.forgotBtn}
            </Button>
            {error && <p className="text-center text-[0.82rem] text-red-500 mt-4">{error}</p>}
          </form>
        )}

        <p className="text-center text-[0.85rem] text-warm-gray mt-6">
          <Link to="/login" className="text-terracotta font-semibold hover:text-terracotta-dark">{a.backToLogin}</Link>
        </p>
      </div>
    </div>
  );
}
