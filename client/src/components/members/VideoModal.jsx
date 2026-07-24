import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchExerciseGif } from "../../lib/gif.js";

// A video/gif directly linked on the exercise (via its media_url).
function linkedMedia(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (m) return { type: "yt", src: `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: "file", src: url };
  if (/\.gif(\?|$)/i.test(url)) return { type: "gif", src: url };
  return null;
}

// Kept for tests + the last-resort YouTube-search embed when nothing else works.
export function resolveEmbed(url, name) {
  const linked = linkedMedia(url);
  if (linked && (linked.type === "yt" || linked.type === "file")) return linked;
  const q = encodeURIComponent("how to " + (name || "exercise"));
  return { type: "yt", src: `https://www.youtube.com/embed?listType=search&list=${q}` };
}

const YT_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

// A popup that shows the exercise demo without leaving the app:
//  1. a video/gif linked on the exercise, else
//  2. an auto GIF searched by the exercise name (Giphy, until a video is linked), else
//  3. the YouTube "how to <exercise>" search embed.
// Close via the ✕ (top-right), clicking the backdrop, or pressing Esc.
export default function VideoModal({ open, onClose, url, name }) {
  const { t } = useLanguage();
  const tr = t.tracker;
  const linked = linkedMedia(url);
  const [gif, setGif] = useState(null);
  const [gifDone, setGifDone] = useState(false);
  const [gifError, setGifError] = useState(false);

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

  // No linked video → try to auto-load a GIF of the exercise by name.
  useEffect(() => {
    if (!open || linkedMedia(url)) return;
    let active = true;
    setGif(null);
    setGifDone(false);
    setGifError(false);
    fetchExerciseGif(name)
      .then((g) => { if (active) { setGif(g); setGifDone(true); } })
      .catch(() => { if (active) setGifDone(true); });
    return () => { active = false; };
  }, [open, url, name]);

  if (!open) return null;

  const searchEmbed = resolveEmbed(null, name);
  const fallbackLink = url || `https://www.youtube.com/results?search_query=${encodeURIComponent("how to " + (name || ""))}`;

  let media;
  if (linked && linked.type === "file") {
    media = <video src={linked.src} controls autoPlay className="w-full h-full" />;
  } else if (linked && linked.type === "gif") {
    media = <img src={linked.src} alt={name || ""} className="w-full h-full object-contain" />;
  } else if (linked) {
    media = <iframe className="w-full h-full" src={linked.src} title={name || "video"} allow={YT_ALLOW} allowFullScreen />;
  } else if (!gifDone) {
    media = <span className="text-white/60 text-[0.85rem]">…</span>;
  } else if (gif && !gifError) {
    media = <img src={gif} alt={name || ""} onError={() => setGifError(true)} className="w-full h-full object-contain" />;
  } else {
    media = <iframe className="w-full h-full" src={searchEmbed.src} title={name || "video"} allow={YT_ALLOW} allowFullScreen />;
  }

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

        <div className="aspect-video bg-black flex items-center justify-center">
          {media}
        </div>

        <div className="px-4 py-2.5 text-right">
          <a href={fallbackLink} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] font-semibold text-terracotta hover:text-terracotta-dark">
            {tr.openInYoutube} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
