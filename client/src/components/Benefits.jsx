import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Benefits() {
  const { t } = useLanguage();
  const b = t.benefits;
  const h = t.how;

  return (
    <section
      id="benefits"
      className="relative"
      style={{ background: "linear-gradient(165deg, var(--color-cream) 0%, var(--color-sand) 100%)" }}
    >
      <div className="max-w-[1100px] mx-auto px-[5%] py-24">
        <Reveal className="text-center mb-14">
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {b.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
            {b.title1}
            <em className="italic text-terracotta">{b.titleEm}</em>
            {b.title2}
          </h2>
          <p className="text-[1.05rem] text-warm-gray max-w-[560px] mx-auto leading-[1.75] font-light">
            {b.sub}
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-[860px] mx-auto items-stretch">
          {b.programs.map((p, i) => (
            <Reveal key={i} delay={i * 0.1} className="h-full">
              <div
                className={`relative h-full flex flex-col bg-white rounded-[28px] p-8 sm:p-10 transition-all ${
                  p.featured
                    ? "border-2 border-terracotta shadow-[0_20px_50px_rgba(176,125,31,0.18)]"
                    : "border border-sand shadow-[0_8px_24px_rgba(44,44,42,0.05)]"
                }`}
              >
                {p.featured && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 bg-terracotta text-white text-[0.68rem] font-semibold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full">
                    {b.popular}
                  </span>
                )}

                <h3 className="font-display text-[1.6rem] font-semibold text-charcoal">{p.name}</h3>
                <p className="text-[0.88rem] text-warm-gray mt-1.5 mb-6 leading-[1.5]">{p.desc}</p>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[3rem] font-semibold text-forest leading-none">{p.price}</span>
                  <span className="text-[0.9rem] text-warm-gray">{p.period}</span>
                </div>
                {p.badge && (
                  <span className="inline-block self-start text-[0.74rem] font-semibold text-terracotta bg-terracotta/10 px-3 py-1 rounded-full mt-3">
                    {p.badge}
                  </span>
                )}

                <ul className="grid gap-3 my-7">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[0.9rem] text-charcoal/80 leading-[1.55]">
                      <span className="text-terracotta mt-0.5 shrink-0 font-semibold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/ready"
                  className={`mt-auto text-center py-3.5 rounded-full text-[0.95rem] font-semibold transition-all ${
                    p.featured
                      ? "bg-terracotta text-white hover:bg-terracotta-dark hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(176,125,31,0.3)]"
                      : "border-2 border-terracotta text-terracotta hover:bg-terracotta hover:text-white"
                  }`}
                >
                  {b.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The Process — what's actually included (more than just diet & food) */}
        <div id="how" className="mt-24 scroll-mt-24">
          <Reveal className="text-center mb-12 max-w-[640px] mx-auto">
            <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
              {h.label}
            </div>
            <h3 className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-4">
              {h.title1}
              <em className="italic text-terracotta">{h.titleEm}</em>
            </h3>
            <p className="text-[1rem] text-warm-gray leading-[1.75] font-light">{h.sub}</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
            {h.steps.map((step, i) => (
              <Reveal key={i} delay={i * 0.1} className="h-full">
                <div className="h-full flex flex-col bg-white rounded-2xl border border-sand p-7 shadow-[0_8px_24px_rgba(44,44,42,0.05)]">
                  <div className="font-display text-[3rem] font-semibold text-terracotta/25 leading-none mb-4">
                    {step.num}
                  </div>
                  <h4 className="font-display text-[1.3rem] font-semibold text-charcoal mb-2.5">{step.h}</h4>
                  <p className="text-[0.88rem] text-warm-gray leading-[1.7]">{step.p}</p>
                  <span className="inline-block self-start mt-4 text-[0.72rem] font-semibold tracking-wide text-forest bg-sage-light/50 px-3.5 py-1.5 rounded-full">
                    {step.badge}
                  </span>
                  {step.link && (
                    <Link
                      to="/ready"
                      className="inline-flex items-center gap-2 mt-5 self-start bg-terracotta text-white text-[0.82rem] font-semibold px-5 py-2.5 rounded-full shadow-[0_8px_24px_rgba(176,125,31,0.3)] hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all"
                    >
                      {step.link} →
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
