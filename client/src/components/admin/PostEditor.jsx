import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { apiAuth } from "../../lib/api";

const inputClass =
  "w-full px-[18px] py-3 border-[1.5px] border-sand rounded-2xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";

// `post` is an existing post to edit, or null to create a new one.
export default function PostEditor({ post, onSaved, onCancel, onAuthError }) {
  const { t } = useLanguage();
  const a = t.admin;
  const isNew = !post;
  const [form, setForm] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    excerpt: post?.excerpt || "",
    coverImage: post?.coverImage || "",
    content: post?.content || "",
    author: post?.author || "Claudia Bittner",
    lang: post?.lang || "es",
    published: post?.published ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(a.titleRequired);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        await apiAuth("/api/admin/posts", "POST", form);
      } else {
        await apiAuth(`/api/admin/posts/${post.id}`, "PUT", form);
      }
      onSaved();
    } catch (err) {
      if (err.unauthorized) return onAuthError();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-[24px] p-6 sm:p-8 border border-sand shadow-[0_12px_40px_rgba(44,44,42,0.06)]">
      <h2 className="font-display text-[1.5rem] font-semibold text-charcoal mb-6">
        {isNew ? a.newPost : a.editPost}
      </h2>

      <div className="grid gap-4">
        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldTitle}</label>
          <input type="text" value={form.title} onChange={update("title")} className={inputClass} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldSlug}</label>
            <input type="text" value={form.slug} onChange={update("slug")} placeholder={a.slugPh} className={inputClass} />
          </div>
          <div>
            <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldAuthor}</label>
            <input type="text" value={form.author} onChange={update("author")} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldLang}</label>
          <select value={form.lang} onChange={update("lang")} className={`${inputClass} cursor-pointer`}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldCover}</label>
          <input type="url" value={form.coverImage} onChange={update("coverImage")} placeholder="https://..." className={inputClass} />
        </div>

        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldExcerpt}</label>
          <textarea rows="2" value={form.excerpt} onChange={update("excerpt")} className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className="block text-[0.8rem] font-semibold text-charcoal mb-1.5">{a.fieldContent}</label>
          <textarea rows="14" value={form.content} onChange={update("content")} placeholder={a.contentPh} className={`${inputClass} resize-y font-mono text-[0.85rem] leading-[1.6]`} />
          <p className="text-[0.74rem] text-light-gray mt-1.5">{a.markdownHint}</p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="w-5 h-5 accent-terracotta"
          />
          <span className="text-[0.88rem] font-medium text-charcoal">{a.publishedLabel}</span>
        </label>
      </div>

      {error && <p className="text-[0.82rem] text-red-500 mt-4">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={busy}
          className="bg-terracotta text-white text-[0.9rem] font-semibold px-6 py-3 rounded-full hover:bg-terracotta-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {busy ? a.saving : a.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[0.9rem] font-semibold px-6 py-3 rounded-full border border-sand text-warm-gray hover:bg-sand transition-colors"
        >
          {a.cancel}
        </button>
      </div>
    </form>
  );
}
