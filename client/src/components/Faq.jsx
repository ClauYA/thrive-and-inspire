import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Faq() {
  const { t } = useLanguage();
  const f = t.faq;
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24">
        <Reveal className="text-center mb-14">
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {f.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
            {f.title1}
            <em className="italic text-terracotta">{f.titleEm}</em>
          </h2>
          <p className="text-[1.05rem] text-warm-gray max-w-[560px] mx-auto leading-[1.75] font-light">{f.sub}</p>
        </Reveal>

        <div className="max-w-[760px] mx-auto grid gap-3">
          {f.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`bg-white border-[1.5px] rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? "border-sage-light" : "border-sand hover:border-sage-light"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex justify-between items-center gap-4 px-6 py-[22px] text-left text-[0.95rem] font-semibold text-charcoal cursor-pointer"
                >
                  {item.q}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[0.7rem] transition-all ${
                      isOpen ? "bg-sage-light rotate-180" : "bg-sand"
                    }`}
                  >
                    ▾
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-[22px] text-[0.9rem] text-warm-gray leading-[1.75]">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
