import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

// Lightweight top bar for the blog + post pages (the landing Navbar uses
// in-page hash links that don't apply on these routes).
export default function BlogHeader() {
  const { t, toggle } = useLanguage();

  return (
    <nav className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-[5%] py-4 bg-cream/90 backdrop-blur-md border-b border-light-gray/30">
      <Link to="/" className="font-display text-2xl font-semibold text-forest tracking-tight">
        Lift<span className="text-terracotta">&amp;</span>Inspire
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="text-sm font-medium text-warm-gray hover:text-forest transition-colors"
        >
          {t.blog.home}
        </Link>
        <button
          onClick={toggle}
          className="bg-transparent border-[1.5px] border-sage-light text-forest px-4 py-2 rounded-full text-[0.82rem] font-semibold hover:bg-forest hover:text-white hover:border-forest transition-all"
        >
          🌐 {t.nav.langLabel}
        </button>
      </div>
    </nav>
  );
}
