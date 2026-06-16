import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { setSession } from "../../lib/userApi";
import { Button, Input, Field } from "../ui";

export default function Login() {
  const { t } = useLanguage();
  const a = t.auth;
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");
      setSession(data.token, data.user);
      navigate("/app");
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
      <form onSubmit={submit} className="w-full max-w-[400px] bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
        <h1 className="font-display text-[1.7rem] font-semibold text-charcoal mb-1.5">{a.loginTitle}</h1>
        <p className="text-[0.85rem] text-warm-gray mb-6">{a.loginSub}</p>

        <div className="mb-4">
          <Field label={a.email}>
            <Input type="email" value={form.email} onChange={update("email")} placeholder={a.emailPh} autoComplete="username" />
          </Field>
        </div>
        <div className="mb-5">
          <Field label={a.password}>
            <Input type="password" value={form.password} onChange={update("password")} placeholder={a.passwordPh} autoComplete="current-password" />
          </Field>
        </div>

        <Button type="submit" disabled={busy} size="lg" className="w-full">
          {busy ? a.loggingIn : a.loginBtn}
        </Button>
        {error && <p className="text-center text-[0.82rem] text-red-500 mt-4">{error}</p>}

        <p className="text-center text-[0.85rem] text-warm-gray mt-6">
          {a.noAccount}{" "}
          <Link to="/signup" className="text-terracotta font-semibold hover:text-terracotta-dark">{a.signupLink}</Link>
        </p>
      </form>
    </div>
  );
}
