import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "ti-lang";

// Decide the initial language: a previously saved choice wins; otherwise we
// honor the visitor's browser language (Spanish speakers land on Spanish).
function getInitialLang() {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "es") return saved;
  const browser = (navigator.language || "en").toLowerCase();
  return browser.startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  // Persist the choice and keep <html lang> in sync for a11y / SEO.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((prev) => (prev === "en" ? "es" : "en"));
  }, []);

  // t = the translation dictionary for the active language.
  const value = { lang, setLang, toggle, t: translations[lang] };
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
