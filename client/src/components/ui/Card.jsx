// Card — standard surface used for content blocks across the site.
// Set `featured` for the highlighted (amber-bordered) variant.
export default function Card({ featured = false, className = "", ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl transition-all ${
        featured
          ? "border-2 border-terracotta shadow-[0_20px_50px_rgba(176,125,31,0.18)]"
          : "border border-sand shadow-[0_8px_24px_rgba(44,44,42,0.05)]"
      } ${className}`}
      {...props}
    />
  );
}
