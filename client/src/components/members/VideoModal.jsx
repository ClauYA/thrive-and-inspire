import { useEffect } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

// Turn any exercise media reference into something we can play IN-APP:
//  • a specific YouTube link  → embedded player for that video
//  • no link (just a name)    → embedded player that plays the top
//                               "how to <exercise>" search result
function resolveEmbed(url, name) {
  if (url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
    if (m) return { type: "yt", src: `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` };
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: "file", src: url };
  }
  const q = encodeURIComponent("how to " + (name || "exercise"));
  return { type: "yt", src: `https://www.youtube.com/embed?listType=search&list=${q}` };
}

// A popup that plays the exercise demo without leaving the app.
// Close via the ✕ (top-right), clicking the backdrop, or pressing Esc.
export default function VideoModal({ open, onClose, url, name }) {
  const { t } = useLanguage();
  const tr = t.tracker;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const media = resolveEmbed(url, name);
  const fallback = url || `https://www.youtube.com/results?search_query=${encodeURIComponent("how to " + (name || ""))}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[720px] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-sand">
          <span className="font-semibold text-charcoal text-[0.95rem] truncate">{name || tr.watchVideo}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr.videoClose}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-warm-gray hover:bg-sand hover:text-charcoal text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="aspect-video bg-black">
          {media.type === "file" ? (
            <video src={media.src} controls autoPlay className="w-full h-full" />
          ) : (
            <iframe
              className="w-full h-full"
              src={media.src}
              title={name || "video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="px-4 py-2.5 text-right">
          <a href={fallback} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] font-semibold text-terracotta hover:text-terracotta-dark">
            {tr.openInYoutube} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
