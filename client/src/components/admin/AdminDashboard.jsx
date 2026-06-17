import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiAuth, getToken, clearToken } from "../../lib/api";
import { formatDate } from "../../lib/format";
import PostEditor from "./PostEditor";
import TestimonialsAdmin from "./TestimonialsAdmin";

export default function AdminDashboard() {
  const { t, lang } = useLanguage();
  const a = t.admin;
  const navigate = useNavigate();
  const [tab, setTab] = useState("posts"); // "posts" | "testimonials"
  const [posts, setPosts] = useState(null); // null = loading
  const [editing, setEditing] = useState(null); // null | post | "new"
  const [error, setError] = useState("");

  const goLogin = useCallback(() => {
    clearToken();
    navigate("/admin/login");
  }, [navigate]);

  const load = useCallback(async () => {
    try {
      const data = await apiAuth("/api/admin/posts");
      setPosts(data.posts);
    } catch (err) {
      if (err.unauthorized) return goLogin();
      setError(err.message);
      setPosts([]);
    }
  }, [goLogin]);

  useEffect(() => {
    if (!getToken()) {
      navigate("/admin/login");
      return;
    }
    load();
  }, [load, navigate]);

  const remove = async (post) => {
    if (!window.confirm(a.confirmDelete)) return;
    try {
      await apiAuth(`/api/admin/posts/${post.id}`, "DELETE");
      load();
    } catch (err) {
      if (err.unauthorized) return goLogin();
      setError(err.message);
    }
  };

  const onSaved = () => {
    setEditing(null);
    load();
  };

  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <nav className="flex items-center justify-between px-[5%] py-4 bg-white border-b border-sand">
        <Link to="/" className="font-display text-xl font-semibold text-forest tracking-tight">
          Lift<span className="text-terracotta">&amp;</span>Inspire
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/blog" className="text-[0.85rem] font-medium text-warm-gray hover:text-forest transition-colors">
            {a.viewBlog}
          </Link>
          <button onClick={goLogin} className="text-[0.85rem] font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
            {a.logout}
          </button>
        </div>
      </nav>

      <main className="max-w-[860px] mx-auto px-[5%] py-12">
        {editing !== null ? (
          <PostEditor
            post={editing === "new" ? null : editing}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
            onAuthError={goLogin}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-8 bg-white border border-sand rounded-full p-1 w-fit">
              <button
                onClick={() => setTab("posts")}
                className={`text-[0.85rem] font-semibold px-5 py-2 rounded-full transition-colors ${tab === "posts" ? "bg-terracotta text-white" : "text-warm-gray"}`}
              >
                {a.tabPosts}
              </button>
              <button
                onClick={() => setTab("testimonials")}
                className={`text-[0.85rem] font-semibold px-5 py-2 rounded-full transition-colors ${tab === "testimonials" ? "bg-terracotta text-white" : "text-warm-gray"}`}
              >
                {a.tabTestimonials}
              </button>
            </div>

            {tab === "testimonials" ? (
              <TestimonialsAdmin onAuthError={goLogin} />
            ) : (
              <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-display text-[2rem] font-semibold text-charcoal">{a.dashboard}</h1>
              <button
                onClick={() => setEditing("new")}
                className="bg-terracotta text-white text-[0.88rem] font-semibold px-5 py-2.5 rounded-full hover:bg-terracotta-dark transition-colors shadow-[0_8px_24px_rgba(176,125,31,0.3)]"
              >
                + {a.newPost}
              </button>
            </div>

            {error && <p className="text-[0.85rem] text-red-500 mb-4">{error}</p>}

            {posts === null ? (
              <p className="text-warm-gray">{a.loading}</p>
            ) : posts.length === 0 ? (
              <p className="text-warm-gray py-8">{a.noPosts}</p>
            ) : (
              <div className="grid gap-3">
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-sand p-4 sm:p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-charcoal text-[0.95rem] truncate">{p.title}</h3>
                        <span
                          className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-full ${
                            p.published ? "bg-sage-light text-forest" : "bg-sand text-warm-gray"
                          }`}
                        >
                          {p.published ? a.published : a.draft}
                        </span>
                      </div>
                      <div className="text-[0.76rem] text-warm-gray mt-1">
                        /{p.slug} · {formatDate(p.createdAt, lang)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditing(p)}
                        className="text-[0.82rem] font-semibold text-forest border border-sage-light px-4 py-2 rounded-full hover:bg-sage-light/40 transition-colors"
                      >
                        {a.edit}
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="text-[0.82rem] font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        {a.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
