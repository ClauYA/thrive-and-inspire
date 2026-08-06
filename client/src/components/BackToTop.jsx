import { useEffect, useState } from "react";

// Floating "back to top" button — appears once the user scrolls down.
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={toTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full bg-terracotta text-white shadow-[0_8px_24px_rgba(176,125,31,0.35)] flex items-center justify-center hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
