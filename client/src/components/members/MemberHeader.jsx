import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { clearSession } from "../../lib/userApi";

export default function MemberHeader() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const links = [
    { to: "/app", label: tr.appTitle },
    { to: "/app/plans", label: tr.plansLink },
    { to: "/app/exercises", label: tr.catalogLink },
    { to: "/app/nutrition", label: tr.nutLink },
    { to: "/app/progress", label: tr.progress },
    { to: "/app/checkin", label: tr.ciLink },
  ];

  return (
    <nav className="relative flex items-center justify-between gap-3 px-[5%] py-4 bg-white border-b border-sand sticky top-0 z-50">
      <Link to="/app" className="font-display text-xl font-semibold text-forest tracking-tight shrink-0">
        Lift<span className="text-terracotta">&amp;</span>Inspire
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-5">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="text-[0.85rem] font-medium text-warm-gray hover:text-forest transition-colors">
            {l.label}
          </Link>
        ))}
        <button onClick={logout} className="text-[0.85rem] font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
          {tr.logout}
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menu"
        className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
      >
        <span className={`block h-0.5 w-6 bg-charcoal transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`block h-0.5 w-6 bg-charcoal transition-all ${menuOpen ? "opacity-0" : ""}`} />
        <span className={`block h-0.5 w-6 bg-charcoal transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full inset-x-0 md:hidden bg-white border-b border-sand px-[5%] py-4 flex flex-col gap-3 shadow-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="text-[0.95rem] font-medium text-charcoal py-1"
            >
              {l.label}
            </Link>
          ))}
          <button onClick={() => { setMenuOpen(false); logout(); }} className="text-left text-[0.95rem] font-semibold text-terracotta py-1">
            {tr.logout}
          </button>
        </div>
      )}
    </nav>
  );
}
