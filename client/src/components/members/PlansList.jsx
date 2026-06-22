import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { userApi, getUserToken } from "../../lib/userApi";
import MemberHeader from "./MemberHeader";
import { Button } from "../ui";

export default function PlansList() {
  const { t } = useLanguage();
  const tr = t.tracker;
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null); // null = loading
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await userApi("/api/plans");
      setPlans(d.plans);
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
      setPlans([]);
    }
  }, [navigate]);

  useEffect(() => {
    if (!getUserToken()) {
      navigate("/login");
      return;
    }
    load();
  }, [load, navigate]);

  const activate = async (id) => {
    try {
      await userApi(`/api/plans/${id}/activate`, "POST");
      load();
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(tr.confirmDeletePlan)) return;
    try {
      await userApi(`/api/plans/${id}`, "DELETE");
      load();
    } catch (e) {
      if (e.unauthorized) return navigate("/login");
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <MemberHeader />
      <main className="max-w-[820px] mx-auto px-[5%] py-10">
        <button onClick={() => navigate("/app")} className="text-terracotta text-[0.85rem] font-semibold mb-5 hover:text-terracotta-dark">
          {tr.back}
        </button>

        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <h1 className="font-display text-[1.8rem] font-semibold text-charcoal">{tr.plansTitle}</h1>
          <Button as={Link} to="/app/plans/new" size="sm" className="whitespace-nowrap">
            + {tr.newPlan}
          </Button>
        </div>
        <p className="text-[0.88rem] text-warm-gray mb-6">{tr.plansSub}</p>

        {error && <p className="text-red-500 text-[0.85rem] mb-4">{error}</p>}

        {plans === null ? (
          <p className="text-warm-gray">{tr.loading}</p>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-warm-gray mb-6">{tr.noPlans}</p>
            <Button as={Link} to="/app/plans/new">+ {tr.newPlan}</Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {plans.map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl border p-4 sm:p-5 ${p.isActive ? "border-terracotta shadow-[0_8px_24px_rgba(176,125,31,0.12)]" : "border-sand"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-charcoal text-[1rem]">{p.name}</h3>
                      {p.isActive && <span className="text-[0.66rem] font-semibold px-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta-dark">{tr.planActive}</span>}
                    </div>
                    {p.objective && <div className="text-[0.84rem] text-warm-gray mt-0.5">{p.objective}</div>}
                    <div className="text-[0.76rem] text-light-gray mt-1">
                      {p.weekCount} {tr.weekCountLabel}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {!p.isActive && (
                      <button onClick={() => activate(p.id)} className="text-[0.8rem] font-semibold text-terracotta border border-terracotta/40 px-4 py-2 rounded-full hover:bg-terracotta/5 transition-colors">
                        {tr.makeActive}
                      </button>
                    )}
                    <Link to={`/app/plans/${p.id}`} className="text-[0.8rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full hover:bg-sage-light/40 transition-colors">
                      {tr.editPlanBtn}
                    </Link>
                    <button onClick={() => remove(p.id)} className="text-[0.8rem] font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">
                      {tr.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
