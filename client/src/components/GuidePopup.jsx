import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const STORAGE_KEY = "ti-guide-popup";

const initialForm = { firstName: "", email: "" };

export default function GuidePopup() {
  const { t } = useLanguage();
  const g = t.guide;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  // Show the popup a few seconds after landing — but only if the visitor
  // hasn't already dismissed or submitted it before.
  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      setStatus("error");
      setErrorMsg(g.validation);
      return;
    }

    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      window.localStorage.setItem(STORAGE_KEY, "submitted");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(g.error);
    }
  };

  const inputClass =
    "w-full px-[18px] py-3.5 border-[1.5px] border-sand rounded-2xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-charcoal/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            className="relative w-full max-w-[440px] bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_30px_80px_rgba(44,44,42,0.25)]"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label={g.close}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-warm-gray hover:text-charcoal hover:bg-sand transition-colors text-xl leading-none"
            >
              ×
            </button>

            {status === "success" ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">💌</div>
                <h3 className="font-display text-[1.6rem] font-semibold text-charcoal mb-2">{g.success}</h3>
                <button
                  type="button"
                  onClick={dismiss}
                  className="mt-4 bg-terracotta text-white text-[0.9rem] font-semibold px-6 py-3 rounded-full hover:bg-terracotta-dark transition-colors"
                >
                  {g.close}
                </button>
              </div>
            ) : (
              <>
                <span className="inline-block text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-terracotta bg-terracotta/10 px-3.5 py-1.5 rounded-full mb-4">
                  {g.badge}
                </span>
                <h3 className="font-display text-[1.7rem] font-semibold leading-[1.2] text-charcoal mb-3">{g.title}</h3>
                <p className="text-[0.9rem] text-warm-gray leading-[1.65] mb-6">{g.body}</p>

                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div>
                    <label htmlFor="guideFirstName" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{g.firstName}</label>
                    <input id="guideFirstName" type="text" value={form.firstName} onChange={update("firstName")} placeholder={g.firstNamePh} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="guideEmail" className="block text-[0.82rem] font-semibold text-charcoal mb-2">{g.email}</label>
                    <input id="guideEmail" type="email" value={form.email} onChange={update("email")} placeholder={g.emailPh} className={inputClass} />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full py-3.5 rounded-full text-[1rem] font-semibold text-white bg-terracotta hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all mt-1 shadow-[0_8px_24px_rgba(196,113,74,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "sending" ? g.submitting : g.submit}
                  </button>

                  {status === "error" && <p className="text-center text-[0.82rem] text-red-500">{errorMsg}</p>}
                  <p className="text-center text-[0.76rem] text-light-gray">{g.note}</p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
