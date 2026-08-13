import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiAuth } from "../../lib/api";

const ROLES = ["head_coach", "coach", "assistant"];
const PERMS = ["ownClients", "createPlans", "manageExercises", "billing"];
const EMPTY_FORM = {
  name: "", email: "", role: "coach",
  permissions: { ownClients: true, createPlans: true, manageExercises: false, billing: false },
};

function initials(name, email) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || src.slice(0, 2).toUpperCase();
}

export default function CoachesAdmin({ onAuthError }) {
  const { t } = useLanguage();
  const a = t.admin;
  const [coaches, setCoaches] = useState(null); // null = loading
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(null); // { name, invite_token }
  const [copied, setCopied] = useState(false);

  const roleLabel = (r) => ({ head_coach: a.roleHeadCoach, coach: a.roleCoach, assistant: a.roleAssistant }[r] || r);
  const statusLabel = (s) => ({ active: a.statusActive, pending: a.statusPending, disabled: a.statusDisabled }[s] || s);
  const permLabel = (p) => ({ ownClients: a.permOwnClients, createPlans: a.permCreatePlans, manageExercises: a.permManageExercises, billing: a.permBilling }[p]);

  const load = useCallback(async () => {
    try {
      const d = await apiAuth("/api/admin/coaches");
      setCoaches(d.coaches || []);
    } catch (err) {
      if (err.unauthorized) return onAuthError?.();
      setError(err.message);
      setCoaches([]);
    }
  }, [onAuthError]);

  useEffect(() => { load(); }, [load]);

  const togglePerm = (p) => setForm((f) => ({ ...f, permissions: { ...f.permissions, [p]: !f.permissions[p] } }));

  const inviteCoach = async () => {
    setError("");
    if (!form.name.trim()) { setError(a.coachName); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setError(a.coachEmail); return; }
    setSaving(true);
    try {
      const d = await apiAuth("/api/admin/coaches", "POST", form);
      setInvite(d.coach);
      setCopied(false);
      setForm(EMPTY_FORM);
      setShowInvite(false);
      load();
    } catch (err) {
      if (err.unauthorized) return onAuthError?.();
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id, role) => {
    setCoaches((cs) => cs.map((c) => (c.id === id ? { ...c, role } : c)));
    try { await apiAuth(`/api/admin/coaches/${id}`, "PATCH", { role }); }
    catch (err) { if (err.unauthorized) return onAuthError?.(); load(); }
  };

  const setStatus = async (id, status) => {
    setCoaches((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    try { await apiAuth(`/api/admin/coaches/${id}`, "PATCH", { status }); }
    catch (err) { if (err.unauthorized) return onAuthError?.(); load(); }
  };

  const remove = async (id) => {
    if (!window.confirm(a.confirmRemoveCoach)) return;
    try { await apiAuth(`/api/admin/coaches/${id}`, "DELETE"); load(); }
    catch (err) { if (err.unauthorized) return onAuthError?.(); setError(err.message); }
  };

  const inviteLink = invite ? `${window.location.origin}/coach/accept?token=${invite.invite_token}` : "";
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(inviteLink); setCopied(true); } catch { /* ignore */ }
  };

  const input = "w-full px-3 py-2.5 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white";

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-[2rem] font-semibold text-charcoal">{a.coachesTitle}</h1>
        <button onClick={() => { setShowInvite((v) => !v); setInvite(null); setError(""); }} className="bg-terracotta text-white text-[0.88rem] font-semibold px-5 py-2.5 rounded-full hover:bg-terracotta-dark transition-colors">
          + {a.inviteCoach}
        </button>
      </div>

      {invite && (
        <div className="bg-sage-light/25 border border-sage-light rounded-2xl p-4 mb-6">
          <div className="text-[0.85rem] text-charcoal mb-2">{a.inviteCreated}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-[0.78rem] text-forest bg-white border border-sand rounded-lg px-3 py-2 break-all flex-1 min-w-0">{inviteLink}</code>
            <button onClick={copyLink} className="text-[0.82rem] font-semibold text-white bg-forest px-4 py-2 rounded-full hover:bg-forest/90 whitespace-nowrap">
              {copied ? "✓" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="bg-white border border-sand rounded-2xl p-5 sm:p-6 mb-6">
          <h2 className="font-display text-[1.3rem] font-semibold text-charcoal mb-1">{a.inviteCoach}</h2>
          <p className="text-[0.84rem] text-warm-gray mb-4">{a.inviteCoachSub}</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-warm-gray mb-1.5">{a.coachName}</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. María Fernanda G." className={input} />
            </div>
            <div>
              <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-warm-gray mb-1.5">{a.coachEmail}</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="coach@thriveandinspire.com" className={input} />
            </div>
          </div>

          <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-warm-gray mb-1.5">{a.coachRole}</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {ROLES.map((r) => (
              <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, role: r }))} className={`px-4 py-2 rounded-full text-[0.82rem] font-semibold border transition-colors ${form.role === r ? "bg-terracotta text-white border-terracotta" : "bg-sage-light/40 text-forest border-transparent hover:bg-sage-light"}`}>
                {roleLabel(r)}
              </button>
            ))}
          </div>

          <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-warm-gray mb-2">{a.coachPermissions}</label>
          <div className="grid gap-2 mb-5">
            {PERMS.map((p) => (
              <label key={p} className="flex items-center gap-2.5 text-[0.86rem] text-charcoal cursor-pointer">
                <input type="checkbox" checked={!!form.permissions[p]} onChange={() => togglePerm(p)} className="w-4 h-4 accent-[#511a54]" />
                {permLabel(p)}
              </label>
            ))}
          </div>

          {error && <p className="text-red-500 text-[0.84rem] mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={inviteCoach} disabled={saving} className="bg-terracotta text-white font-semibold px-6 py-3 rounded-full hover:bg-terracotta-dark disabled:opacity-60">
              {saving ? "…" : `✉ ${a.sendInvite}`}
            </button>
            <button onClick={() => { setShowInvite(false); setError(""); }} className="font-semibold px-6 py-3 rounded-full border border-sand text-warm-gray hover:bg-sand">
              {a.cancel || "Cancelar"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-sand rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[1.2rem] font-semibold text-charcoal">{a.activeCoaches}</h2>
          {coaches && <span className="text-[0.78rem] text-warm-gray">{coaches.length} {a.coachCount}</span>}
        </div>

        {coaches === null ? (
          <p className="text-warm-gray text-[0.88rem]">…</p>
        ) : coaches.length === 0 ? (
          <p className="text-warm-gray text-[0.88rem] py-4">{a.noCoaches}</p>
        ) : (
          <div className="grid gap-3">
            {coaches.map((c) => (
              <div key={c.id} className="flex items-center gap-3 flex-wrap border border-sand rounded-xl p-3 sm:p-4">
                <div className="w-10 h-10 rounded-full bg-sage-light/60 text-forest font-semibold grid place-items-center text-[0.82rem] shrink-0">
                  {initials(c.name, c.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-charcoal text-[0.9rem] truncate">{c.name || "—"}</div>
                  <div className="text-[0.76rem] text-warm-gray truncate">{c.email}</div>
                </div>
                <select value={c.role} onChange={(e) => changeRole(c.id, e.target.value)} className="text-[0.78rem] font-semibold text-forest bg-sage-light/40 border border-transparent rounded-full px-3 py-1.5 cursor-pointer">
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
                <div className="text-[0.8rem] text-charcoal text-center w-16">
                  <div className="font-semibold">{c.client_count}</div>
                  <div className="text-[0.66rem] text-warm-gray uppercase tracking-wide">{a.coachClients}</div>
                </div>
                <span className={`text-[0.72rem] font-semibold px-2.5 py-1 rounded-full ${c.status === "active" ? "bg-sage-light text-forest" : c.status === "disabled" ? "bg-sand text-warm-gray" : "bg-gold/20 text-charcoal/70"}`}>
                  ● {statusLabel(c.status)}
                </span>
                <div className="flex items-center gap-2">
                  {c.status === "active" ? (
                    <button onClick={() => setStatus(c.id, "disabled")} className="text-[0.78rem] font-semibold text-warm-gray hover:text-charcoal">{a.disableCoach}</button>
                  ) : (
                    <button onClick={() => setStatus(c.id, "active")} className="text-[0.78rem] font-semibold text-forest hover:text-terracotta">{a.activateCoach}</button>
                  )}
                  <button onClick={() => remove(c.id)} className="text-[0.78rem] font-semibold text-red-500 hover:text-red-600">{a.removeCoach}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
