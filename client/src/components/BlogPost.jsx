import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import BlogHeader from "./BlogHeader";
import Footer from "./Footer";
import { apiGet } from "../lib/api";
import { formatDate } from "../lib/format";

export default function BlogPost() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const b = t.blog;
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let active = true;
    setPost(undefined);
    apiGet(`/api/posts/${slug}`)
      .then((d) => active && setPost(d.post))
      .catch(() => active && setPost(null));
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="relative z-[1] min-h-screen flex flex-col bg-cream">
      <BlogHeader />
      <main className="flex-1">
        <article className="max-w-[760px] mx-auto px-[5%] pt-32 pb-24">
          <Link to="/blog" className="text-terracotta text-[0.85rem] font-semibold hover:text-terracotta-dark transition-colors">
            {b.back}
          </Link>

          {post === undefined ? (
            <p className="text-warm-gray mt-10">{b.loading}</p>
          ) : post === null ? (
            <p className="text-warm-gray mt-10">{b.notFound}</p>
          ) : (
            <>
              <div className="text-[0.8rem] text-warm-gray mt-6 mb-3">
                {formatDate(post.createdAt, lang)} · {b.by} {post.author}
              </div>
              <h1 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.1] tracking-tight text-charcoal mb-6">
                {post.title}
              </h1>
              {post.coverImage && (
                <img src={post.coverImage} alt="" className="w-full rounded-[20px] mb-8 object-cover" />
              )}
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
