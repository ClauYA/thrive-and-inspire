// Circular progress ring (SVG, no deps). Shows % reached with optional value/goal below.
export default function ProgressRing({ pct = 0, label, value, goal, unit = "g", color = "#b07d1f", size = 84 }) {
  const stroke = size < 64 ? 7 : 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circ * (1 - clamped / 100);
  const pctFont = size < 64 ? "text-[0.8rem]" : "text-[1.05rem]";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9e2d0" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-display ${pctFont} font-semibold text-charcoal`}>{Math.round(pct)}%</span>
        </div>
      </div>
      {label && <div className="text-[0.68rem] uppercase tracking-[0.08em] text-warm-gray mt-1">{label}</div>}
      {value != null && goal != null && (
        <div className="text-[0.72rem] text-charcoal/70">{Math.round(value)}/{Math.round(goal)}{unit}</div>
      )}
    </div>
  );
}
