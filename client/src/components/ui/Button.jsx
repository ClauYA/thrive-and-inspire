// Button — the one button used across the site.
// variants: primary | secondary | ghost | forest · sizes: sm | md | lg
const VARIANTS = {
  primary:
    "bg-terracotta text-white hover:bg-terracotta-dark hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(176,125,31,0.3)]",
  secondary: "border-2 border-terracotta text-terracotta hover:bg-terracotta hover:text-white",
  ghost: "text-warm-gray hover:text-forest",
  forest: "bg-forest text-white hover:bg-forest-light",
  // For dark/photo backgrounds:
  white: "bg-white text-charcoal hover:-translate-y-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.2)]",
  outlineLight: "border-2 border-white/25 text-white/80 hover:border-white hover:text-white",
};
const SIZES = {
  sm: "text-[0.82rem] px-4 py-2",
  md: "text-[0.95rem] px-6 py-3",
  lg: "text-[1rem] px-8 py-4",
};

export default function Button({ variant = "primary", size = "md", as: As = "button", className = "", ...props }) {
  return (
    <As
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
