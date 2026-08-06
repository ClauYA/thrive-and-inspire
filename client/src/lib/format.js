// Locale-aware date formatting for blog posts.
export function formatDate(iso, lang = "en") {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
