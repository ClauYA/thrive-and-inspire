import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { useLanguage } from "../i18n/LanguageContext";

export default function Testimonials() {
  const { t } = useLanguage();
  const tt = t.testimonials;

  return (
    <section id="testimonials" className="relative bg-warm-white border-y border-sand">
      <div className="max-w-[1100px] mx-auto px-[5%] py-24">
        <Reveal className="text-center mb-16">
          <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
            {tt.label}
          </div>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal mb-5">
            {tt.title1}
            <em className="italic text-terracotta">{tt.titleEm}</em>
          </h2>
          <p className="text-[1.05rem] text-warm-gray max-w-[560px] mx-auto leading-[1.75] font-light">{tt.sub}</p>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tt.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className={`relative rounded-[28px] p-8 border transition-all hover:-translate-y-1 ${
                item.featured
                  ? "bg-forest border-forest text-white"
                  : "bg-white border-sand hover:shadow-[0_12px_40px_rgba(44,44,42,0.08)]"
              }`}
            >
              <span
                className={`absolute top-5 right-5 text-[0.72rem] font-semibold px-2.5 py-1 rounded-full ${
                  item.featured ? "bg-white/15 text-white/90" : "bg-sage/15 text-forest"
                }`}
              >
                {item.tag}
              </span>
              <div className={`text-[0.9rem] mb-4 tracking-[2px] ${item.featured ? "brightness-150" : ""}`}>
                ★★★★★
              </div>
              <p
                className={`font-display text-[1.05rem] italic leading-[1.65] mb-6 ${
                  item.featured ? "text-white" : "text-charcoal"
                }`}
              >
                {item.text}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-[1.1rem] ${
                    item.featured ? "bg-white/20" : "bg-sage-light"
                  }`}
                >
                  {item.avatar}
                </div>
                <div>
                  <div className={`text-[0.88rem] font-semibold ${item.featured ? "text-white" : "text-charcoal"}`}>
                    {item.name}
                  </div>
                  <div className={`text-[0.78rem] mt-0.5 ${item.featured ? "text-white/60" : "text-warm-gray"}`}>
                    {item.detail}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
