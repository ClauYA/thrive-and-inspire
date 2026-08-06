import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiAuth } from "../../lib/api";
import { formatDate } from "../../lib/format";

const TYPE_LABELS = {
  application: { es: "Aplicación (aviso)", en: "Application (notice)" },
  application_autoreply: { es: "Bienvenida + Calendly", en: "Welcome + Calendly" },
  intake: { es: "Formulario /ready", en: "Intake /ready" },
  guide_lead: { es: "Guía gratis", en: "Free guide" },
  testimonial: { es: "Testimonio (aviso)", en: "Testimonial (notice)" },
  password_reset: { es: "Reseteo de contraseña", en: "Password reset" },
};

export default function EmailLog({ onAuthError }) {
  const { t, lang } = useLanguage();
  const a = t.admin;
  const [emails, setEmails] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    apiAuth("/api/admin/emails")
      .then((d) => setEmails(d.emails))
      .catch((err) => {
        if (err.unauthorized) return onAuthError();
        setError(err.message);
        setEmails([]);
      });
  }, [onAuthError]);

  if (emails === null) return <p className="text-warm-gray">{a.loading}</p>;
  if (error) return <p className="text-[0.85rem] text-red-500 mb-4">{error}</p>;
  if (emails.length === 0) return <p className="text-warm-gray py-8">{a.noEmails}</p>;

  const statusBadge = (s) => {
    if (s === "failed") return { cls: "bg-red-100 text-red-600", label: a.emailFailed };
    if (s === "skipped") return { cls: "bg-sand text-warm-gray", label: a.emailSkipped };
    return { cls: "bg-sage-light text-forest", label: a.emailSent };
  };

  return (
    <div className="grid gap-3">
      {emails.map((e) => {
        const badge = statusBadge(e.status);
        const typeLabel = TYPE_LABELS[e.type]?.[lang === "en" ? "en" : "es"] || e.type;
        return (
          <div key={e.id} className="bg-white rounded-2xl border border-sand p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta-dark">{typeLabel}</span>
                  <span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>
                <h3 className="font-semibold text-charcoal text-[0.92rem] mt-1.5">{e.subject || "—"}</h3>
                <div className="text-[0.76rem] text-warm-gray mt-0.5">
                  {a.emailTo}: {e.recipient} · {formatDate(e.created_at, lang)}
                </div>
                {e.status === "failed" && e.error && <div className="text-[0.76rem] text-red-500 mt-1">{e.error}</div>}
              </div>
              {e.body && (
                <button
                  onClick={() => setOpen(open === e.id ? null : e.id)}
                  className="text-[0.8rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full hover:bg-sage-light/40 transition-colors shrink-0"
                >
                  {open === e.id ? a.hideBody : a.viewBody}
                </button>
              )}
            </div>
            {open === e.id && e.body && (
              <pre className="mt-3 pt-3 border-t border-sand text-[0.8rem] text-charcoal whitespace-pre-wrap font-body leading-relaxed">{e.body}</pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
