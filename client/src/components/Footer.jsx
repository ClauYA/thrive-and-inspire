import { useLanguage } from "../i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-charcoal border-t border-white/10 px-[5%] py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div className="font-display text-[1.2rem] font-semibold text-white/60">
        Thrive <span className="text-terracotta">&amp;</span> Inspire Coaching
      </div>
      <p className="text-[0.8rem] text-white/30">{t.footer.copy}</p>
    </footer>
  );
}
