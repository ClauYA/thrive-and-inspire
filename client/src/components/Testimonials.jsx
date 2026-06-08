import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Testimonials() {
  const { t } = useLanguage();
  const tt = t.testimonials;
  const items = tt.items;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-rotate through the reviews, one at a time.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 5500);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const item = items[index];

  return (
    <section id="testimonials" className="relative bg-warm-white border-y border-sand">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24">
        <Reveal className="text-center mb-14">
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {tt.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
            {tt.title1}
            <em className="italic text-terracotta">{tt.titleEm}</em>
          </h2>
          <p className="text-[1.05rem] text-warm-gray max-w-[560px] mx-auto leading-[1.75] font-light">{tt.sub}</p>
        </Reveal>

        <div
          className="relative max-w-[680px] mx-auto min-h-[300px] flex items-stretch"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full rounded-[28px] p-8 sm:p-10 border ${
                item.featured ? "bg-forest border-forest text-white" : "bg-white border-sand shadow-[0_12px_40px_rgba(44,44,42,0.06)]"
              }`}
            >
              <span
                className={`absolute top-6 right-6 text-[0.72rem] font-semibold px-2.5 py-1 rounded-full ${
                  item.featured ? "bg-white/15 text-white/90" : "bg-sage/15 text-forest"
                }`}
              >
                {item.tag}
              </span>
              <div className={`text-[1rem] mb-4 tracking-[2px] ${item.featured ? "brightness-150" : ""}`}>★★★★★</div>
              <p
                className={`font-display text-[1.25rem] italic leading-[1.6] mb-7 ${
                  item.featured ? "text-white" : "text-charcoal"
                }`}
              >
                {item.text}
              </p>
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className={`w-12 h-12 rounded-full object-cover ${item.featured ? "ring-2 ring-white/30" : "ring-2 ring-sage-light"}`}
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[1.1rem] ${item.featured ? "bg-white/20" : "bg-sage-light"}`}>
                    {item.avatar}
                  </div>
                )}
                <div>
                  <div className={`text-[0.9rem] font-semibold ${item.featured ? "text-white" : "text-charcoal"}`}>{item.name}</div>
                  <div className={`text-[0.78rem] mt-0.5 ${item.featured ? "text-white/60" : "text-warm-gray"}`}>{item.detail}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-8">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Review ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-terracotta" : "w-2 bg-sand hover:bg-light-gray"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
