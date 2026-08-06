// Lightweight dependency-free SVG line chart.
// points: [{ label, value }]
export default function LineChart({ points, color = "#b07d1f", unit = "" }) {
  if (!points || points.length === 0) return null;

  const W = 640;
  const H = 240;
  const pad = 40;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = points.length;

  const x = (i) => (n === 1 ? W / 2 : pad + (i / (n - 1)) * (W - 2 * pad));
  const y = (v) => H - pad - ((v - min) / range) * (H - 2 * pad);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* y gridlines (min, mid, max) */}
      {[min, (min + max) / 2, max].map((v, i) => (
        <g key={i}>
          <line x1={pad} y1={y(v)} x2={W - pad} y2={y(v)} stroke="#e7dcc9" strokeWidth="1" />
          <text x={pad - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#9aa39b">
            {Math.round(v)}
            {unit}
          </text>
        </g>
      ))}

      <path d={area} fill={color} opacity="0.08" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="3.5" fill={color} />
      ))}

      {/* x labels: first and last */}
      <text x={x(0)} y={H - pad + 18} textAnchor="start" fontSize="11" fill="#9aa39b">
        {points[0].label}
      </text>
      {n > 1 && (
        <text x={x(n - 1)} y={H - pad + 18} textAnchor="end" fontSize="11" fill="#9aa39b">
          {points[n - 1].label}
        </text>
      )}
    </svg>
  );
}
