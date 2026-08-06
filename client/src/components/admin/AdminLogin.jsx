import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { setToken } from "../../lib/api";

const inputClass =
  "w-full px-[18px] py-3.5 border-[1.5px] border-sand rounded-2xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";

export default function AdminLogin() {
  const { t } = useLanguage();
  const a = t.admin;
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-5 relative z-[1]">
      <Link to="/" className="font-display text-2xl font-semibold text-forest tracking-tight mb-8">
        Lift<span className="text-terracotta">&amp;</span>Inspire
      </Link>
      <form onSubmit={submit} className="w-full max-w-[400px] bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
        <h1 className="font-display text-[1.7rem] font-semibold text-charcoal mb-6">{a.loginTitle}</h1>

        <div className="mb-4">
          <label htmlFor="email" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.email}</label>
          <input id="email" type="email" value={form.email} onChange={update("email")} className={inputClass} autoComplete="username" />
        </div>
        <div className="mb-5">
          <label htmlFor="password" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{a.password}</label>
          <input id="password" type="password" value={form.password} onChange={update("password")} className={inputClass} autoComplete="current-password" />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-full text-[1rem] font-semibold text-white bg-terracotta hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all shadow-[0_8px_24px_rgba(176,125,31,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? a.signingIn : a.signIn}
        </button>

        {error && <p className="text-center text-[0.82rem] text-red-500 mt-4">{error}</p>}
      </form>
    </div>
  );
}
