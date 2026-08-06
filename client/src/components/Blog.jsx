import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import BlogHeader from "./BlogHeader";
import Footer from "./Footer";
import { apiGet } from "../lib/api";
import { formatDate } from "../lib/format";

export default function Blog() {
  const { t, lang } = useLanguage();
  const b = t.blog;
  const [posts, setPosts] = useState(null); // null = loading

  useEffect(() => {
    setPosts(null);
    apiGet(`/api/posts?lang=${lang}`)
      .then((d) => setPosts(d.posts))
      .catch(() => setPosts([]));
  }, [lang]);

  return (
    <div className="relative z-[1] min-h-screen flex flex-col bg-cream">
      <BlogHeader />
      <main className="flex-1">
        <section className="max-w-[1100px] mx-auto px-[5%] pt-32 pb-24">
          <div className="text-center mb-14">
            <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">
              {b.label}
            </div>
            <h1 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.1] tracking-tight text-charcoal mb-5">
              {b.title}
            </h1>
            <p className="text-[1.05rem] text-warm-gray max-w-[560px] mx-auto leading-[1.75] font-light">
              {b.sub}
            </p>
          </div>

          {posts === null ? (
            <p className="text-center text-warm-gray">{b.loading}</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-warm-gray py-10">{b.empty}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group block bg-white rounded-[20px] overflow-hidden border border-sand hover:border-sage-light hover:shadow-[0_12px_32px_rgba(44,44,42,0.1)] hover:-translate-y-1 transition-all"
                >
                  {p.coverImage ? (
                    <img src={p.coverImage} alt="" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-sage-light to-sage" />
                  )}
                  <div className="p-6">
                    <div className="text-[0.74rem] text-warm-gray mb-2">{formatDate(p.createdAt, lang)}</div>
                    <h2 className="font-display text-[1.4rem] font-semibold text-charcoal leading-snug mb-2 group-hover:text-terracotta transition-colors">
                      {p.title}
                    </h2>
                    {p.excerpt && (
                      <p className="text-[0.88rem] text-warm-gray leading-[1.6] line-clamp-3">{p.excerpt}</p>
                    )}
                    <span className="text-terracotta text-[0.82rem] font-semibold mt-4 inline-block">
                      {b.readMore}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
