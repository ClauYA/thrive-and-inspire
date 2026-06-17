import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiAuth } from "../../lib/api";
import { formatDate } from "../../lib/format";

export default function TestimonialsAdmin({ onAuthError }) {
  const { t, lang } = useLanguage();
  const a = t.admin;
  const [items, setItems] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({}); // id -> avatar url being edited

  const load = useCallback(async () => {
    try {
      const data = await apiAuth("/api/admin/testimonials");
      setItems(data.testimonials);
      setDrafts(Object.fromEntries(data.testimonials.map((it) => [it.id, it.image || ""])));
    } catch (err) {
      if (err.unauthorized) return onAuthError();
      setError(err.message);
      setItems([]);
    }
  }, [onAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id, body) => {
    try {
      await apiAuth(`/api/admin/testimonials/${id}`, "PUT", body);
      load();
    } catch (err) {
      if (err.unauthorized) return onAuthError();
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(a.confirmDeleteT)) return;
    try {
      await apiAuth(`/api/admin/testimonials/${id}`, "DELETE");
      load();
    } catch (err) {
      if (err.unauthorized) return onAuthError();
      setError(err.message);
    }
  };

  if (items === null) return <p className="text-warm-gray">{a.loading}</p>;
  if (error) return <p className="text-[0.85rem] text-red-500 mb-4">{error}</p>;
  if (items.length === 0) return <p className="text-warm-gray py-8">{a.noTestimonials}</p>;

  return (
    <div className="grid gap-3">
      {error && <p className="text-[0.85rem] text-red-500">{error}</p>}
      {items.map((it) => (
        <div key={it.id} className="bg-white rounded-2xl border border-sand p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-charcoal text-[0.95rem]">{it.name}</h3>
                <span className="text-gold text-[0.85rem] tracking-[1px]">{"★".repeat(it.rating || 5)}</span>
                <span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-full ${it.published ? "bg-sage-light text-forest" : "bg-sand text-warm-gray"}`}>
                  {it.published ? a.published : a.pending}
                </span>
                {it.featured && <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta-dark">{a.featured}</span>}
              </div>
              {it.detail && <div className="text-[0.76rem] text-warm-gray mt-0.5">{it.detail}</div>}
            </div>
            <div className="text-[0.72rem] text-light-gray shrink-0">{formatDate(it.createdAt, lang)}</div>
          </div>

          <p className="text-[0.88rem] text-charcoal italic leading-relaxed mb-3">"{it.text}"</p>
          {it.email && <p className="text-[0.74rem] text-warm-gray mb-3">{it.email}</p>}

          <div className="flex items-center gap-2 mb-3">
            <input
              type="url"
              value={drafts[it.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
              placeholder={a.avatarPh}
              className="flex-1 min-w-0 px-3 py-2 border-[1.5px] border-sand rounded-xl text-[0.82rem] text-charcoal bg-cream outline-none focus:border-terracotta-light focus:bg-white"
            />
            <button
              onClick={() => patch(it.id, { image: drafts[it.id] || "" })}
              className="text-[0.8rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full hover:bg-sage-light/40 transition-colors shrink-0"
            >
              {a.saveAvatar}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => patch(it.id, { published: !it.published })}
              className={`text-[0.82rem] font-semibold px-4 py-2 rounded-full transition-colors ${
                it.published ? "border border-sand text-warm-gray hover:bg-sand" : "bg-terracotta text-white hover:bg-terracotta-dark"
              }`}
            >
              {it.published ? a.unpublish : a.approve}
            </button>
            <button
              onClick={() => patch(it.id, { featured: !it.featured })}
              className="text-[0.82rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full hover:bg-sage-light/40 transition-colors"
            >
              {it.featured ? a.unfeature : a.feature}
            </button>
            <button
              onClick={() => remove(it.id)}
              className="text-[0.82rem] font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors ml-auto"
            >
              {a.delete}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
