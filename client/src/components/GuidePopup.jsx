import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { Button, Input, Field } from "./ui";

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
                <Button type="button" onClick={dismiss} className="mt-4">
                  {g.close}
                </Button>
              </div>
            ) : (
              <>
                <span className="inline-block text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-terracotta bg-terracotta/10 px-3.5 py-1.5 rounded-full mb-4">
                  {g.badge}
                </span>
                <h3 className="font-display text-[1.7rem] font-semibold leading-[1.2] text-charcoal mb-3">{g.title}</h3>
                <p className="text-[0.9rem] text-warm-gray leading-[1.65] mb-6">{g.body}</p>

                <form onSubmit={handleSubmit} className="grid gap-4">
                  <Field label={g.firstName}>
                    <Input id="guideFirstName" type="text" value={form.firstName} onChange={update("firstName")} placeholder={g.firstNamePh} />
                  </Field>
                  <Field label={g.email}>
                    <Input id="guideEmail" type="email" value={form.email} onChange={update("email")} placeholder={g.emailPh} />
                  </Field>

                  <Button type="submit" disabled={status === "sending"} size="lg" className="w-full mt-1">
                    {status === "sending" ? g.submitting : g.submit}
                  </Button>

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
