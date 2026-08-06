import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { Button } from "./ui";
import { Globe } from "lucide-react";

const links = [
  { href: "#struggles", key: "about" },
  { href: "#how", key: "how" },
  { href: "#faq", key: "faq" },
];

export default function Navbar() {
  const { t, toggle } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-[5%] backdrop-blur-md border-b transition-all duration-300 ${
        scrolled
          ? "py-3 bg-cream/95 border-light-gray/40 shadow-sm"
          : "py-5 bg-cream/80 border-light-gray/30"
      }`}
    >
      <a href="#hero" className="font-display text-2xl font-semibold text-forest tracking-tight">
        Lift<span className="text-terracotta">&amp;</span>Inspire
      </a>

      <ul className="hidden md:flex items-center gap-8 list-none">
        {links.map((l) => (
          <li key={l.key}>
            <a
              href={l.href}
              className="text-sm font-medium text-warm-gray tracking-wide hover:text-forest transition-colors"
            >
              {t.nav[l.key]}
            </a>
          </li>
        ))}
        <li>
          <Link
            to="/blog"
            className="text-sm font-medium text-warm-gray tracking-wide hover:text-forest transition-colors"
          >
            {t.nav.blog}
          </Link>
        </li>
        <li>
          <Link
            to="/login"
            className="text-sm font-medium text-warm-gray tracking-wide hover:text-forest transition-colors"
          >
            {t.nav.train}
          </Link>
        </li>
        <li>
          <Button as="a" href="#apply" size="sm">{t.nav.apply}</Button>
        </li>
      </ul>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="bg-transparent border-[1.5px] border-sage-light text-forest px-4 py-2 rounded-full text-[0.82rem] font-semibold hover:bg-forest hover:text-white hover:border-forest transition-all"
        >
          <span className="inline-flex items-center gap-1.5"><Globe size={15} /> {t.nav.langLabel}</span>
        </button>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`block h-0.5 w-6 bg-charcoal transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-charcoal transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-charcoal transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full inset-x-0 md:hidden bg-cream/95 backdrop-blur-md border-b border-light-gray/40 px-[5%] py-4 flex flex-col gap-3">
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-warm-gray py-1"
            >
              {t.nav[l.key]}
            </a>
          ))}
          <Link
            to="/blog"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium text-warm-gray py-1"
          >
            {t.nav.blog}
          </Link>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium text-warm-gray py-1"
          >
            {t.nav.train}
          </Link>
          <Button as="a" href="#apply" size="sm" onClick={() => setMenuOpen(false)} className="w-full">
            {t.nav.apply}
          </Button>
        </div>
      )}
    </nav>
  );
}
