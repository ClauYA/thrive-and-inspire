import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Benefits() {
  const { t } = useLanguage();
  const b = t.benefits;

  return (
    <section id="benefits" className="relative">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <Reveal>
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {b.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
            {b.title1}
            <em className="italic text-terracotta">{b.titleEm}</em>
            {b.title2}
          </h2>

          <div className="grid gap-5 mt-10">
            {b.items.map((item, i) => (
              <div
                key={i}
                className="flex gap-[18px] items-start p-6 bg-white rounded-2xl border border-sand hover:border-sage-light hover:shadow-[0_8px_24px_rgba(44,44,42,0.08)] hover:translate-x-1.5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sage-light to-sage flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-[0.95rem] font-semibold text-charcoal mb-1">{item.h}</h4>
                  <p className="text-[0.85rem] text-warm-gray leading-[1.6]">{item.p}</p>
                  {item.link && (
                    <Link
                      to="/ready"
                      className="inline-flex items-center gap-2 mt-4 bg-terracotta text-white text-[0.85rem] font-semibold px-5 py-2.5 rounded-full shadow-[0_8px_24px_rgba(176,125,31,0.3)] hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all"
                    >
                      {item.link} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:pt-16">
          <div className="bg-gradient-to-br from-terracotta to-terracotta-dark text-white rounded-[28px] p-10 mb-5">
            <h3 className="font-display text-[1.8rem] font-semibold mb-4">{b.featureTitle}</h3>
            <p className="text-[0.9rem] opacity-85 leading-[1.75]">{b.featureP}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {b.featureTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/15 border border-white/20 text-white px-3.5 py-1.5 rounded-full text-[0.78rem] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {b.stats.map((stat) => (
              <div key={stat.label} className="bg-white border border-sand rounded-2xl p-6 text-center">
                <div className="font-display text-[2.4rem] font-semibold text-forest leading-none mb-1.5">
                  {stat.num}
                </div>
                <div className="text-[0.8rem] text-warm-gray">{stat.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
