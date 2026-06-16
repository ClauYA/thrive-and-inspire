// SectionHeading — eyebrow + title used to open a section.
export default function SectionHeading({ eyebrow, title, em, sub, center = false, className = "" }) {
  return (
    <div className={`${center ? "text-center mx-auto max-w-[640px]" : ""} ${className}`}>
      {eyebrow && (
        <div className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-4">{eyebrow}</div>
      )}
      <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.15] tracking-tight text-charcoal">
        {title} {em && <em className="italic text-terracotta">{em}</em>}
      </h2>
      {sub && <p className="text-[1.05rem] text-warm-gray leading-[1.75] font-light mt-4">{sub}</p>}
    </div>
  );
}
