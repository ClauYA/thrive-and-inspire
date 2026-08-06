// Badge / chip — small status pill. tones: amber | sage | gold | neutral | mint
const TONES = {
  amber: "bg-terracotta/10 text-terracotta",
  sage: "bg-sage-light/50 text-forest",
  gold: "bg-gold/20 text-charcoal",
  neutral: "bg-sand text-warm-gray",
  mint: "bg-support-mint text-action-primary",
};

export default function Badge({ tone = "amber", className = "", ...props }) {
  return (
    <span className={`inline-block text-[0.74rem] font-semibold px-3 py-1 rounded-full ${TONES[tone]} ${className}`} {...props} />
  );
}
