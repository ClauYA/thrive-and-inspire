import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { Button } from "./ui";

export default function Hero() {
  const { t } = useLanguage();
  const h = t.hero;
  const proof = h.proof || [];
  const [index, setIndex] = useState(0);

  // Auto-rotate the proof carousel.
  useEffect(() => {
    if (proof.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % proof.length), 5000);
    return () => clearInterval(id);
  }, [proof.length]);

  const item = proof[index];

  return (
    <section
      id="hero"
      className="relative min-h-screen grid lg:grid-cols-2 items-center gap-16 px-[5%] pt-32 pb-20 overflow-hidden"
    >
      {/* Background photo of Claudia with a light overlay so the copy stays readable */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/claudia.png"
          alt=""
          className="w-full h-full object-cover object-[center_top] lg:object-[right_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-cream/95 via-cream/85 to-cream/55" />
      </div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2 text-[0.8rem] font-semibold tracking-[0.12em] uppercase text-terracotta mb-6 px-4 py-2 bg-terracotta/10 rounded-full border border-terracotta/20">
          <span className="w-1.5 h-1.5 bg-terracotta rounded-full" style={{ animation: "pulseDot 2s ease-in-out infinite" }} />
          {h.eyebrow}
        </div>

        <h1 className="font-display text-[clamp(2.8rem,5vw,4.2rem)] font-semibold leading-[1.1] tracking-tight text-charcoal mb-6">
          {h.title1} <em className="italic text-terracotta">{h.titleEm}</em>
        </h1>

        <p className="text-[1.1rem] text-warm-gray max-w-[480px] leading-[1.75] mb-10 font-light">{h.sub}</p>

        <div className="flex flex-wrap gap-4 items-center">
          <Button as="a" href="#apply" size="lg" className="group">
            {h.ctaApply}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <Button as={Link} to="/book" size="lg" variant="secondary">
            📅 {h.ctaBook}
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-12 pt-8 border-t border-sand">
          <div className="flex">
            {["🌿", "💪", "✨", "🌱"].map((e, i) => (
              <span key={i} className={`w-9 h-9 rounded-full border-2 border-warm-white flex items-center justify-center text-[0.9rem] bg-sage-light ${i ? "-ml-2" : ""}`}>
                {e}
              </span>
            ))}
          </div>
          <div className="text-[0.85rem] text-warm-gray">
            <strong className="block text-charcoal text-[0.9rem] mb-0.5">{h.trustStrong}</strong>
            {h.trustText}
          </div>
        </div>
      </motion.div>

      {/* Proof carousel: habits → results */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_20px_60px_rgba(44,44,42,0.08),0_4px_16px_rgba(176,125,31,0.12)] min-h-[460px] flex flex-col">
          {item && (
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <img src={item.image} alt={item.name} loading="lazy" className="w-12 h-12 rounded-full object-cover ring-2 ring-sage-light shrink-0" />
                  <div className="font-display text-[1.45rem] font-semibold text-charcoal flex-1 min-w-0">{item.name}</div>
                  <span className="text-[0.78rem] font-semibold text-terracotta bg-terracotta/10 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {item.streak}
                  </span>
                </div>

                {/* Habits */}
                <div className="grid gap-2.5 mb-5">
                  {item.habits.map((habit, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[0.9rem] text-charcoal">
                      <span className="w-5 h-5 rounded-full bg-sage flex items-center justify-center text-white text-[0.7rem] shrink-0">✓</span>
                      {habit}
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div className="bg-gradient-to-br from-forest to-forest-light text-white rounded-2xl p-4 mb-5">
                  <div className="text-[0.72rem] uppercase tracking-[0.1em] text-sage-light mb-2">
                    {h.resultTitle} {item.weeks}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.results.map((r, i) => (
                      <span key={i} className="text-[0.82rem] font-semibold bg-white/15 px-2.5 py-1 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>

                {/* Quote + stars */}
                <div className="mt-auto">
                  <p className="font-display text-[1.05rem] italic text-charcoal leading-[1.5] mb-2">"{item.quote}"</p>
                  <div className="text-gold tracking-[2px]">★★★★★</div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Dots */}
          {proof.length > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              {proof.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-terracotta" : "w-2 bg-sand"}`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
