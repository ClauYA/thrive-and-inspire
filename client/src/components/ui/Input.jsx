// Form primitives — shared input, select, textarea + a labelled Field wrapper.
const base =
  "w-full px-4 py-3 border-[1.5px] border-sand rounded-xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";

export function Input({ className = "", ...props }) {
  return <input className={`${base} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${base} resize-none ${className}`} {...props} />;
}

export function Select({ className = "", ...props }) {
  return <select className={`${base} cursor-pointer ${className}`} {...props} />;
}

// Field: label above a control.
export function Field({ label, children }) {
  return (
    <div>
      {label && <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">{label}</label>}
      {children}
    </div>
  );
}
