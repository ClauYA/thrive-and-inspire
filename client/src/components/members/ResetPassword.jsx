import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { setSession } from "../../lib/userApi";
import { Button, Input, Field } from "../ui";

export default function ResetPassword() {
  const { t } = useLanguage();
  const a = t.auth;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError(a.resetInvalid);
  }, [token, a.resetInvalid]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSession(data.token, data.user);
      setDone(true);
      setTimeout(() => navigate("/app"), 1800);
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
        <h1 className="font-display text-[1.7rem] font-semibold text-charcoal mb-1.5">{a.resetTitle}</h1>
        <p className="text-[0.85rem] text-warm-gray mb-6">{a.resetSub}</p>

        {done ? (
          <p className="text-[0.9rem] text-forest bg-sage-light/30 rounded-xl px-4 py-4">{a.resetSuccess}</p>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-5">
              <Field label={a.newPassword}>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={a.passwordPh} autoComplete="new-password" />
              </Field>
            </div>
            <Button type="submit" disabled={busy || !token} size="lg" className="w-full">
              {busy ? a.resetting : a.resetBtn}
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
