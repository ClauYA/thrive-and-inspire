import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";
import { Card, Badge, Button } from "./ui";

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto items-stretch">
          {b.programs.map((p, i) => (
            <Reveal key={i} delay={i * 0.1} className="h-full">
              <Card featured={p.featured} className="relative h-full flex flex-col p-8 sm:p-10">
                {p.featured && (
                  <Badge className="absolute top-0 right-8 -translate-y-1/2 uppercase tracking-[0.1em] !bg-terracotta !text-white">
                    {b.popular}
                  </Badge>
                )}

                <h3 className="font-display text-[1.6rem] font-semibold text-charcoal">{p.name}</h3>
                <p className="text-[0.88rem] text-warm-gray mt-1.5 mb-6 leading-[1.5]">{p.desc}</p>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[3rem] font-semibold text-forest leading-none">{p.price}</span>
                  <span className="text-[0.9rem] text-warm-gray">{p.period}</span>
                </div>
                {p.badge && <Badge tone="amber" className="self-start mt-3">{p.badge}</Badge>}

                <ul className="grid gap-3 my-7">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[0.9rem] text-charcoal/80 leading-[1.55]">
                      <span className="text-terracotta mt-0.5 shrink-0 font-semibold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button as={Link} to="/ready" variant={p.featured ? "primary" : "secondary"} className="mt-auto w-full">
                  {b.cta}
                </Button>
              </Card>
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

          <div className="grid sm:grid-cols-3 gap-4 max-w-[800px] mx-auto">
            {h.steps.map((step, i) => (
              <Reveal key={i} delay={i * 0.1} className="h-full">
                <Card className="h-full flex flex-col p-5">
                  <div className="font-display text-[2rem] font-semibold text-terracotta/25 leading-none mb-2.5">
                    {step.num}
                  </div>
                  <h4 className="font-display text-[1.05rem] font-semibold text-charcoal mb-1.5">{step.h}</h4>
                  <p className="text-[0.8rem] text-warm-gray leading-[1.6]">{step.p}</p>
                  <Badge tone="sage" className="self-start mt-3 tracking-wide">{step.badge}</Badge>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
