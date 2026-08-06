// Helpers de UI: formato, tarjetas, sparklines SVG, toasts, plataformas.

export const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.0', '') + 'K';
  return String(n);
};

export const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

// Sparkline SVG inline a partir de una serie de números.
export function sparkline(values, { w = 120, h = 32, stroke = '#84cc16' } = {}) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / span) * (h - 4) - 2).toFixed(1)}`);
  const last = pts[pts.length - 1].split(',');
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="overflow-visible">
    <polyline fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${pts.join(' ')}"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="${stroke}"/>
  </svg>`;
}

export const card = (inner, cls = '') =>
  `<div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${cls}">${inner}</div>`;

export const PILL = {
  instagram: 'from-pink-500 to-amber-500',
  tiktok: 'from-cyan-400 to-zinc-800',
  youtube: 'from-red-500 to-red-700',
  x: 'from-zinc-600 to-zinc-900',
};
export const platformPill = (p) =>
  `<span class="text-[11px] font-medium px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${PILL[p] || 'from-grass-500 to-grass-700'}">${p}</span>`;

export function toast(msg, kind = 'ok') {
  const t = el(`<div class="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${kind === 'err' ? 'bg-red-600' : 'bg-grass-600'}">${msg}</div>`);
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; }, 1800);
  setTimeout(() => t.remove(), 2300);
}

export const sectionHeader = (titulo, sub, right = '') => `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">${titulo}</h1>
      ${sub ? `<p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">${sub}</p>` : ''}
    </div>
    <div class="flex items-center gap-2">${right}</div>
  </div>`;

export const spinner = `<div class="flex items-center justify-center py-20 text-zinc-400">Cargando…</div>`;
