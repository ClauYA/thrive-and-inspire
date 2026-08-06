// Métricas: vistas IG, guardados, seguidores, seguidores nuevos y DMs, con
// minigráfico por métrica a 7/30/90 días. Alerta + top 5 reels explicados.
import { api } from '../api.js';
import { fmt, card, sparkline, sectionHeader, spinner } from '../ui.js';

const LABEL = {
  vistas: 'Vistas de Instagram',
  guardados: 'Guardados',
  seguidores: 'Seguidores',
  seguidoresNuevos: 'Seguidores nuevos',
  dms: 'Mensajes directos',
};
let rango = 30;

export async function renderMetrics(view) {
  view.innerHTML = sectionHeader('Métricas', 'Cómo viene la semana, con minigráficos a 7 / 30 / 90 días.',
    rangeButtons()) + `<div id="cards">${spinner}</div><div id="reels" class="mt-8"></div>`;
  wireRange(view);
  await load(view);
}

const rangeButtons = () => `
  <div class="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-sm">
    ${[7, 30, 90].map((d) => `<button data-range="${d}" class="px-3 py-1.5 ${rango === d ? 'bg-grass-600 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}">${d}d</button>`).join('')}
  </div>`;

function wireRange(view) {
  view.querySelectorAll('[data-range]').forEach((b) => (b.onclick = () => { rango = Number(b.dataset.range); renderMetrics(view); }));
}

async function load(view) {
  const { tarjetas, top5, medianaVistas30, actualizado } = await api.metrics();

  view.querySelector('#cards').innerHTML = `
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      ${tarjetas.map((t) => metricCard(t)).join('')}
    </div>`;

  view.querySelector('#reels').innerHTML = `
    ${sectionHeader('Bombazos de la semana', `Top 5 por vistas. Mediana de los últimos 30 días: <b>${fmt(medianaVistas30)}</b>. Marcamos 🚨 los que la duplican.`)}
    <div class="space-y-2">${top5.map(reelRow).join('')}</div>
    <p class="text-xs text-zinc-400 mt-4">Datos al ${actualizado}. Hoy lee data/metrics.json — conectar Instagram Graph API en store.js.</p>`;
}

function metricCard(t) {
  const up = t.delta >= 0;
  return card(`
    <div class="p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-zinc-500">${LABEL[t.key] || t.key}</span>
        <span class="text-xs font-semibold ${up ? 'text-grass-500' : 'text-red-500'}">${up ? '▲' : '▼'} ${Math.abs(t.delta)}%</span>
      </div>
      <div class="mt-1 text-2xl font-bold">${fmt(t.valor)}</div>
      <div class="mt-2">${sparkline(t.spark[rango] || t.spark[30])}</div>
      <div class="text-[11px] text-zinc-400 mt-1">últimos ${rango} días</div>
    </div>`);
}

function reelRow(r) {
  return card(`
    <div class="p-4 flex items-start gap-3 ${r.alerta ? 'ring-1 ring-grass-500/50' : ''}">
      <div class="text-2xl">${r.alerta ? '🚨' : '🎬'}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="font-semibold truncate">${r.titulo}</p>
          <span class="text-sm font-bold shrink-0">${fmt(r.vistas)}</span>
        </div>
        <p class="text-sm text-zinc-500 mt-0.5">${r.porque}</p>
        <div class="text-[11px] text-zinc-400 mt-1">${r.fecha} · ${fmt(r.guardados)} guardados${r.alerta ? ' · duplica la mediana 30d' : ''}</div>
      </div>
    </div>`);
}
