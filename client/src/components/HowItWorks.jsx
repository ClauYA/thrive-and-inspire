import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();
  const h = t.how;

  return (
    <section id="how" className="relative bg-forest text-white">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24">
        <Reveal className="text-center mb-16">
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-sage-light mb-4">
            {h.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight mb-5">
            {h.title1}
            <em className="italic text-sage-light">{h.titleEm}</em>
          </h2>
          <p className="text-[1.05rem] text-white/60 max-w-[560px] mx-auto leading-[1.75] font-light">{h.sub}</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-[3px]">
          {h.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/[0.06] p-10 hover:bg-white/10 transition-colors first:rounded-t-2xl last:rounded-b-2xl md:first:rounded-l-2xl md:first:rounded-tr-none md:last:rounded-r-2xl md:last:rounded-bl-none"
            >
              <div className="font-display text-[4rem] font-semibold text-sage-light/30 leading-none mb-5">
                {step.num}
              </div>
              <h3 className="font-display text-[1.5rem] font-semibold mb-3.5">{step.h}</h3>
              <p className="text-[0.9rem] text-white/60 leading-[1.75]">{step.p}</p>
              <span className="inline-block mt-5 text-[0.75rem] font-semibold tracking-wide text-sage-light bg-sage/15 px-3.5 py-1.5 rounded-full">
                {step.badge}
              </span>
              {step.link && (
                <div>
                  <Link
                    to="/ready"
                    className="inline-flex items-center gap-2 mt-5 bg-terracotta text-white text-[0.85rem] font-semibold px-5 py-2.5 rounded-full shadow-[0_8px_24px_rgba(196,113,74,0.3)] hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all"
                  >
                    {step.link} →
                  </Link>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
