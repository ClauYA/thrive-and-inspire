import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function FinalCta() {
  const { t } = useLanguage();
  const c = t.finalCta;

  return (
    <section id="final-cta" className="relative bg-charcoal text-center overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(196,113,74,0.15), transparent 65%)" }}
      />
      <Reveal className="relative max-w-[1100px] mx-auto px-[5%] py-24">
        <div className="flex justify-center text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-sage-light mb-4">
          {c.label}
        </div>
        <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-white max-w-[640px] mx-auto mb-6">
          {c.title1}
          <em className="italic text-terracotta-light">{c.titleEm}</em>
        </h2>
        <p className="text-[1.05rem] text-white/55 max-w-[560px] mx-auto mb-10 leading-[1.75] font-light">{c.sub}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#apply"
            className="inline-flex items-center gap-2 bg-white text-charcoal px-8 py-4 rounded-full text-[0.95rem] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-all"
          >
            {c.ctaApply}
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 border-2 border-white/25 text-white/80 px-[30px] py-3.5 rounded-full text-[0.95rem] font-medium hover:border-white hover:text-white transition-all"
          >
            {c.ctaHow}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
