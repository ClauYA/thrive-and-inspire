import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUser, clearSession } from "../../lib/userApi";

export default function MemberHeader() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const user = getUser();

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
        {user && <span className="hidden sm:inline text-[0.85rem] text-warm-gray">{user.name}</span>}
        <Link to="/" className="text-[0.85rem] font-medium text-warm-gray hover:text-forest transition-colors">
          {tr.site}
        </Link>
        <button onClick={logout} className="text-[0.85rem] font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
          {tr.logout}
        </button>
      </div>
    </nav>
  );
}
