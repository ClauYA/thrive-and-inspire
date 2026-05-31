import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

function HabitRow({ icon, iconBg, name, fillColor, pct, dots, delay }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[0.85rem] font-semibold text-charcoal mb-1">{name}</div>
        <div className="h-1.5 bg-sand rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${fillColor}`}
            initial={{ width: 0 }}
            whileInView={{ width: pct }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay, ease: "easeOut" }}
          />
        </div>
        <div className="flex gap-[5px] mt-1.5">
          {dots.map((done, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${done || "bg-sand"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative min-h-screen grid lg:grid-cols-2 items-center gap-16 px-[5%] pt-32 pb-20 overflow-hidden"
    >
      <div
        className="hidden lg:block absolute right-[-10%] top-[-5%] w-[55%] h-[110%] z-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, var(--color-sage-light) 0%, var(--color-sand) 50%, transparent 75%)",
          animation: "morphBlob 12s ease-in-out infinite alternate",
        }}
      />

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2 text-[0.8rem] font-semibold tracking-[0.12em] uppercase text-terracotta mb-6 px-4 py-2 bg-terracotta/10 rounded-full border border-terracotta/20">
          <span
            className="w-1.5 h-1.5 bg-terracotta rounded-full"
            style={{ animation: "pulseDot 2s ease-in-out infinite" }}
          />
          {t.hero.eyebrow}
        </div>

        <h1 className="font-display text-[clamp(2.8rem,5vw,4.2rem)] font-semibold leading-[1.1] tracking-tight text-charcoal mb-6">
          {t.hero.title1}
          <br />
          <em className="italic text-terracotta">{t.hero.titleEm}</em>
          <br />
          <span className="text-forest">{t.hero.title2}</span>
        </h1>

        <p className="text-[1.1rem] text-warm-gray max-w-[480px] leading-[1.75] mb-10 font-light">
          {t.hero.sub}
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          <a
            href="#apply"
            className="group inline-flex items-center gap-2.5 bg-terracotta text-white px-8 py-4 rounded-full text-[0.95rem] font-semibold shadow-[0_8px_30px_rgba(196,113,74,0.12)] hover:bg-terracotta-dark hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(196,113,74,0.3)] transition-all"
          >
            {t.hero.ctaApply}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href="#story"
            className="inline-flex items-center gap-2 text-forest text-[0.9rem] font-medium py-3.5 border-b-2 border-sage-light hover:border-forest transition-colors"
          >
            {t.hero.ctaStory}
          </a>
        </div>

        <div className="flex items-center gap-4 mt-12 pt-8 border-t border-sand">
          <div className="flex">
            {["🌿", "💪", "✨", "🌱"].map((e, i) => (
              <span
                key={i}
                className={`w-9 h-9 rounded-full border-2 border-warm-white flex items-center justify-center text-[0.9rem] bg-sage-light ${i ? "-ml-2" : ""}`}
              >
                {e}
              </span>
            ))}
          </div>
          <div className="text-[0.85rem] text-warm-gray">
            <strong className="block text-charcoal text-[0.9rem] mb-0.5">{t.hero.trustStrong}</strong>
            {t.hero.trustText}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative bg-white rounded-[28px] p-9 shadow-[0_20px_60px_rgba(44,44,42,0.08),0_4px_16px_rgba(196,113,74,0.12)]">
          <div
            className="absolute -top-4 -right-5 bg-white rounded-full px-4 py-2.5 text-[0.8rem] font-semibold shadow-[0_8px_24px_rgba(44,44,42,0.08)] text-forest whitespace-nowrap"
            style={{ animation: "floatPill 4s ease-in-out 0.5s infinite" }}
          >
            {t.hero.pillStreak}
          </div>
          <div
            className="absolute -bottom-4 -left-5 bg-white rounded-full px-4 py-2.5 text-[0.8rem] font-semibold shadow-[0_8px_24px_rgba(44,44,42,0.08)] text-terracotta whitespace-nowrap"
            style={{ animation: "floatPill 4s ease-in-out 1.5s infinite" }}
          >
            {t.hero.pillCheckin}
          </div>

          <div className="grid gap-3.5 mb-7">
            <HabitRow
              icon="🧘" iconBg="bg-sage/20" name={t.hero.cardHabit1}
              fillColor="bg-sage" pct="85%" delay={0.8}
              dots={["bg-sage", "bg-sage", "bg-sage", "bg-sage", "bg-sage", "bg-sage", false]}
            />
            <HabitRow
              icon="💧" iconBg="bg-terracotta/10" name={t.hero.cardHabit2}
              fillColor="bg-terracotta-light" pct="70%" delay={1}
              dots={["bg-terracotta-light", "bg-terracotta-light", "bg-terracotta-light", "bg-terracotta-light", false, "bg-terracotta-light", "bg-terracotta-light"]}
            />
            <HabitRow
              icon="🌙" iconBg="bg-gold/15" name={t.hero.cardHabit3}
              fillColor="bg-gold" pct="60%" delay={1.2}
              dots={["bg-sage", "bg-sage", false, "bg-sage", "bg-sage", "bg-sage", false]}
            />
          </div>

          <div className="flex items-center gap-2.5 bg-gradient-to-br from-forest to-forest-light text-white px-5 py-3.5 rounded-2xl">
            <div>
              <div className="font-display text-[2rem] font-semibold leading-none">21</div>
              <div className="text-[0.8rem] opacity-85">{t.hero.streakLabel}</div>
            </div>
            <div className="flex-1 text-right text-[0.8rem] opacity-75 leading-[1.5]">
              "{t.hero.streakQuote}"<br />— <em>Sarah M.</em>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
