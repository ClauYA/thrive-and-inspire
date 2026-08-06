// Card — standard surface used for content blocks across the site.
// Set `featured` for the highlighted (amber-bordered) variant.
export default function Card({ featured = false, className = "", ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl transition-all ${
        featured
          ? "border-2 border-terracotta shadow-feature"
          : "border border-sand shadow-card"
      } ${className}`}
      {...props}
    />
  );
}
