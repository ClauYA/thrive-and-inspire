import { useLanguage } from "../../i18n/LanguageContext";
import CardioForm from "./CardioForm";

// Quick cardio logger in a modal (dashboard "log cardio" button). The fields
// live in the shared CardioForm; this component only adds the modal chrome.
export default function CardioModal({ open, onClose, onSaved, planId, coachNote }) {
  const { t } = useLanguage();
  const tr = t.tracker;

  if (!open) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full sm:max-w-[520px] bg-cream rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-sand">
          <span className="font-display text-[1.3rem] font-semibold text-charcoal">🏃 {tr.cardioLogTitle}</span>
          <button onClick={onClose} aria-label={tr.videoClose} className="w-9 h-9 rounded-full flex items-center justify-center text-warm-gray hover:bg-sand text-2xl leading-none">×</button>
        </div>
        <div className="p-5">
          <CardioForm
            coachNote={coachNote}
            planId={planId}
            onSaved={() => { if (onSaved) onSaved(); onClose(); }}
          />
        </div>
      </div>
    </div>
  );
}
