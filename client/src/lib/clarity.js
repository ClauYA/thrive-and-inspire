// Microsoft Clarity — free click/scroll heatmaps + session recordings.
//
// Loads only when VITE_CLARITY_ID is set, so local dev and PR previews stay
// clean (no tracking) and the app works exactly the same without it.
// The Clarity Project ID is NOT a secret — it ships in the page — so it can
// live in a build env var or be committed directly.
//
// PRIVACY (important for the member area): set masking to "Strict" in the
// Clarity dashboard (Settings → Masking) so personal data — names, weights,
// measurements — is masked in recordings/heatmaps.
export function initClarity(id = import.meta.env.VITE_CLARITY_ID || "xny7te0wup") {
  if (!id || typeof window === "undefined" || window.clarity) return;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", id);
}
