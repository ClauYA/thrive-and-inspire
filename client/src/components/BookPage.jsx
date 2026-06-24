import { useEffect } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";
import { Button } from "./ui";

/* ──────────────────────────────────────────────────────────────
   ⬇️  PEGA AQUÍ TUS DATOS PARA SESIONES SUELTAS PRESENCIALES  ⬇️
   1. CALENDLY_URL: crea un evento NUEVO en Calendly solo para la
      "sesión presencial suelta" y pega aquí su enlace ("Share" → URL).
      (Es independiente del de la videollamada de asesoría.)
   2. STRIPE_PAYMENT_LINK: un "Payment Link" de Stripe para el pago
      de la sesión suelta (Productos → Payment Links).
   3. VENMO_USERNAME: tu usuario de Venmo, SIN la @.
   4. PAYMENT_AMOUNT: opcional, el monto para prellenar Venmo (ej. "60").
   5. ZELLE_HANDLE: el correo o teléfono asociado a tu Zelle.
   El pago en EFECTIVO no necesita configuración: se paga en persona.
   ────────────────────────────────────────────────────────────── */
const CALENDLY_URL = "https://calendly.com/cyabittner/30min"; // ← reemplázalo por el evento presencial
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_7sY9AV6Wu3WY4VM6f15EY00";
const VENMO_USERNAME = "ClauYA";
const PAYMENT_AMOUNT = "60"; // sesión presencial suelta — USD
const SESSION_PRICE = "$60"; // ← cómo se muestra el precio en la página
const ZELLE_HANDLE = "yaczoe@gmail.com"; // ← confirma tu correo/teléfono de Zelle

function buildVenmoLink(note) {
  const params = new URLSearchParams({ txn: "pay", recipients: VENMO_USERNAME, note });
  if (PAYMENT_AMOUNT) params.set("amount", PAYMENT_AMOUNT);
  return `https://venmo.com/?${params.toString()}`;
}

export default function BookPage() {
  const { t, toggle } = useLanguage();
  const b = t.book;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
        <div className="max-w-[680px] mx-auto px-[5%] py-16 sm:py-24">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[0.85rem] text-warm-gray hover:text-forest transition-colors mb-8"
            >
              ← {b.back}
            </Link>
            <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
              {b.label}
            </div>
            <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
              {b.title1}
              <em className="italic text-terracotta">{b.titleEm}</em>
            </h1>
            <p className="text-[0.95rem] text-warm-gray leading-[1.7] mb-6">{b.intro}</p>
            <div className="inline-flex items-baseline gap-2 bg-terracotta/10 border border-terracotta/20 rounded-full px-5 py-2.5 mb-10">
              <span className="text-[0.78rem] font-semibold tracking-[0.06em] uppercase text-terracotta">{b.priceLabel}</span>
              <span className="font-display text-[1.3rem] font-semibold text-charcoal">{SESSION_PRICE}</span>
            </div>
          </Reveal>

          {/* Step 1 — schedule */}
          <Reveal delay={0.05}>
            <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)] mb-6 text-center">
              <div className="font-display text-[1.4rem] font-semibold text-charcoal mb-2">{b.schedTitle}</div>
              <p className="text-[0.88rem] text-warm-gray mb-6">{b.schedSub}</p>
              <Button as="a" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" variant="forest">
                📅 {b.schedBtn}
              </Button>
            </div>
          </Reveal>

          {/* Step 2 — payment */}
          <Reveal delay={0.1}>
            <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(44,44,42,0.08)] text-center">
              <div className="font-display text-[1.4rem] font-semibold text-charcoal mb-2">{b.payTitle}</div>
              <p className="text-[0.88rem] text-warm-gray mb-6">{b.payP}</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                <Button as="a" href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className="w-full">
                  💳 {b.payStripe}
                </Button>
                <a
                  href={buildVenmoLink("Sesion presencial Lift & Inspire")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-4 rounded-full text-[0.95rem] font-semibold text-white bg-[#008CFF] hover:brightness-95 hover:-translate-y-0.5 transition-all shadow-[0_8px_24px_rgba(0,140,255,0.25)]"
                >
                  Venmo
                </a>
              </div>

              {/* Zelle — show the handle to send to (no universal deep link) */}
              <div className="flex items-center gap-4 text-left bg-[#6D1ED4]/5 border border-[#6D1ED4]/20 rounded-2xl px-5 py-4 mb-3">
                <span className="text-xl font-bold text-[#6D1ED4] shrink-0">Z</span>
                <div className="min-w-0">
                  <div className="text-[0.95rem] font-semibold text-[#6D1ED4]">{b.zelleTitle}</div>
                  <div className="text-[0.82rem] text-warm-gray break-words">
                    {b.zelleDesc} <span className="font-semibold text-charcoal">{ZELLE_HANDLE}</span>
                  </div>
                </div>
              </div>

              {/* Cash — paid in person, no link needed */}
              <div className="flex items-center gap-4 text-left bg-sage/10 border border-sage-light rounded-2xl px-5 py-4">
                <span className="text-2xl shrink-0">💵</span>
                <div>
                  <div className="text-[0.95rem] font-semibold text-forest">{b.cashTitle}</div>
                  <div className="text-[0.82rem] text-warm-gray">{b.cashDesc}</div>
                </div>
              </div>

              <p className="text-[0.8rem] text-warm-gray mt-6">{b.payNote}</p>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
