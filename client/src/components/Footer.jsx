import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-charcoal border-t border-white/10 px-[5%] py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div className="font-display text-[1.2rem] font-semibold text-white/60">
        Lift <span className="text-terracotta">&amp;</span> Inspire Coaching
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
        <a
          href="https://instagram.com/liftandinspire_"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-white/60 hover:text-terracotta transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
        <Link to="/feedback" className="text-[0.8rem] font-semibold text-terracotta hover:text-gold transition-colors">
          {t.footer.feedback}
        </Link>
        <p className="text-[0.8rem] text-white/30">{t.footer.copy}</p>
      </div>
    </footer>
  );
}
