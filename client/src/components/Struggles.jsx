import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Struggles() {
  const { t } = useLanguage();
  const s = t.struggles;

  return (
    <section id="struggles" className="relative bg-charcoal text-white">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
        <Reveal>
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-sage-light mb-4">
            {s.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight mb-5">
            {s.title}
          </h2>
          <p className="text-[1.05rem] text-white/60 max-w-[560px] leading-[1.75] font-light">{s.sub}</p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-4">
          {s.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-terracotta/30 hover:-translate-y-1 transition-all"
            >
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h3 className="text-[0.95rem] font-semibold mb-1.5">{item.h}</h3>
              <p className="text-[0.82rem] text-white/50 leading-[1.6]">{item.p}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
