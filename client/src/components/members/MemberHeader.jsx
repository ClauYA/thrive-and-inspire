import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { clearSession } from "../../lib/userApi";

export default function MemberHeader() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-[5%] py-4 bg-white border-b border-sand sticky top-0 z-50">
      <Link to="/app" className="font-display text-xl font-semibold text-forest tracking-tight">
        Lift<span className="text-terracotta">&amp;</span>Inspire
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/app" className="text-[0.85rem] font-medium text-warm-gray hover:text-forest transition-colors">
          {tr.appTitle}
        </Link>
        <Link to="/app/exercises" className="text-[0.85rem] font-medium text-warm-gray hover:text-forest transition-colors">
          {tr.catalogLink}
        </Link>
        <Link to="/app/progress" className="text-[0.85rem] font-medium text-warm-gray hover:text-forest transition-colors">
          {tr.progress}
        </Link>
        <button onClick={logout} className="text-[0.85rem] font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
          {tr.logout}
        </button>
      </div>
    </nav>
  );
}
