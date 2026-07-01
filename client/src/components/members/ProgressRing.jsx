// Circular progress ring (SVG, no deps). Shows % reached with the value/goal below.
export default function ProgressRing({ pct = 0, label, value, goal, unit = "g", color = "#b07d1f" }) {
  const size = 84;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circ * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
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
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[1.05rem] font-semibold text-charcoal">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-[0.7rem] uppercase tracking-[0.08em] text-warm-gray mt-1">{label}</div>
      <div className="text-[0.72rem] text-charcoal/70">{Math.round(value)}/{Math.round(goal)}{unit}</div>
    </div>
  );
}
