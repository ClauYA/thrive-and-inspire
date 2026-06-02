import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Story() {
  const { t } = useLanguage();
  const s = t.story;

  return (
    <section id="story" className="relative">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <Reveal className="relative">
          <div className="relative rounded-[28px] overflow-hidden aspect-[4/5] shadow-[0_20px_60px_rgba(44,44,42,0.08)]">
            <img
              src="/images/ClaudiaFt.png"
              alt={s.imgAlt}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-transparent via-transparent to-forest/40" />
          </div>
          <div className="absolute -bottom-5 -right-2 lg:-right-6 bg-white rounded-2xl p-5 max-w-[240px] shadow-[0_16px_40px_rgba(44,44,42,0.08)]">
            <blockquote className="font-display italic text-[0.95rem] text-charcoal leading-[1.5] mb-2.5">
              {s.quote}
            </blockquote>
            <cite className="text-[0.78rem] text-warm-gray not-italic font-medium">{s.cite}</cite>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {s.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
            {s.title1}
            <em className="italic text-terracotta">{s.titleEm}</em>
          </h2>
          <div className="space-y-5 text-[1rem] text-warm-gray leading-[1.8] font-light">
            {s.paragraphs.map((para, i) =>
              i === s.highlightIndex ? (
                <p key={i}>
                  <strong className="text-charcoal font-semibold">{para}</strong>
                </p>
              ) : (
                <p key={i}>{para}</p>
              )
            )}
          </div>
          <div className="font-display italic text-[1.6rem] text-terracotta mt-8">{s.signature}</div>
          <p className="text-[0.8rem] text-light-gray mt-1.5">{s.creds}</p>
        </Reveal>
      </div>
    </section>
  );
}
