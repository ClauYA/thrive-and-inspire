// Shell de la SPA: barra lateral + router por hash + panel /guion global.
import { el, toast } from './ui.js';
import { api } from './api.js';
import { renderHooks } from './sections/hooks.js';
import { renderMetrics } from './sections/metrics.js';
import { renderCompetitors } from './sections/competitors.js';
import { renderCommunity } from './sections/community.js';
import { renderCalendar } from './sections/calendar.js';
import { renderTrends } from './sections/trends.js';

const ROUTES = [
  { id: 'baul', label: 'Baúl de ganchos', icon: '🪝', render: renderHooks },
  { id: 'metricas', label: 'Métricas', icon: '📊', render: renderMetrics },
  { id: 'competencia', label: 'Competencia', icon: '🔭', render: renderCompetitors },
  { id: 'community', label: 'Community manager', icon: '📣', render: renderCommunity },
  { id: 'calendario', label: 'Calendario', icon: '🗓️', render: renderCalendar },
  { id: 'tendencias', label: 'Tendencias', icon: '⚡', render: renderTrends },
];

const app = document.getElementById('app');

function layout() {
  app.innerHTML = '';
  const nav = ROUTES.map((r) => `
    <a href="#/${r.id}" data-route="${r.id}"
       class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-grass-50 dark:hover:bg-zinc-800 transition">
      <span class="text-lg leading-none">${r.icon}</span><span>${r.label}</span>
    </a>`).join('');

  const sidebar = el(`
    <aside id="sidebar" class="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col hidden md:flex">
      <div class="px-5 py-5 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <div class="h-8 w-8 rounded-lg bg-grass-500 grid place-items-center text-zinc-900 font-black">T</div>
        <div class="font-bold leading-tight">Tablero<br><span class="text-grass-500 text-xs font-semibold">de contenido</span></div>
      </div>
      <nav class="flex-1 p-3 space-y-1">${nav}</nav>
      <div class="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <button id="theme-toggle" class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <span id="theme-label">🌙 Oscuro</span>
        </button>
      </div>
    </aside>`);

  const main = el(`
    <div class="flex-1 flex flex-col min-w-0">
      <header class="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button id="menu-btn" class="text-2xl">☰</button>
        <span class="font-bold">Tablero</span>
        <span class="w-6"></span>
      </header>
      <main id="view" class="flex-1 p-5 md:p-8 max-w-[1400px] w-full mx-auto"></main>
    </div>`);

  app.append(sidebar, main);

  // toggle de tema
  sidebar.querySelector('#theme-toggle').onclick = () => {
    const dark = document.documentElement.classList.toggle('dark');
    sidebar.querySelector('#theme-label').textContent = dark ? '🌙 Oscuro' : '☀️ Claro';
  };
  // menú móvil
  main.querySelector('#menu-btn').onclick = () =>
    sidebar.classList.toggle('hidden') || sidebar.classList.toggle('flex');
}

function setActive(route) {
  document.querySelectorAll('.nav-link').forEach((a) => {
    const on = a.dataset.route === route;
    a.classList.toggle('bg-grass-100', on);
    a.classList.toggle('dark:bg-grass-900/40', on);
    a.classList.toggle('!text-grass-700', on);
    a.classList.toggle('dark:!text-grass-300', on);
  });
}

async function router() {
  const route = (location.hash.replace('#/', '') || 'baul');
  const found = ROUTES.find((r) => r.id === route) || ROUTES[0];
  setActive(found.id);
  const view = document.getElementById('view');
  try {
    await found.render(view);
  } catch (e) {
    view.innerHTML = `<div class="text-red-500">Error: ${e.message}</div>`;
  }
}

// ───────── panel /guion global (lo abre el botón "Usar este" del baúl) ─────────
export async function openGuion(prefill = {}) {
  document.getElementById('guion-panel')?.remove();
  const platforms = ['instagram', 'tiktok', 'youtube', 'x'];
  const panel = el(`
    <div id="guion-panel" class="fixed inset-0 z-40 flex justify-end">
      <div class="absolute inset-0 bg-black/40" data-close></div>
      <div class="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-y-auto">
        <div class="sticky top-0 bg-white dark:bg-zinc-900 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 class="font-bold text-lg">/guion</h2>
          <button data-close class="text-2xl leading-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">×</button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="text-xs font-semibold text-zinc-500 uppercase">Plantilla</label>
            <input id="g-template" value="${(prefill.template || '').replace(/"/g, '&quot;')}" class="mt-1 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs font-semibold text-zinc-500 uppercase">Ángulo</label>
            <input id="g-angulo" value="${prefill.angulo || ''}" placeholder="ej: contrarian / educativo / personal" class="mt-1 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm" />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div><label class="text-xs text-zinc-500">[X]</label><input id="g-x" value="${prefill.x || ''}" class="mt-1 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1.5 text-sm" /></div>
            <div><label class="text-xs text-zinc-500">[Y]</label><input id="g-y" value="${prefill.y || ''}" class="mt-1 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1.5 text-sm" /></div>
            <div><label class="text-xs text-zinc-500">[número]</label><input id="g-n" value="${prefill.numero || ''}" class="mt-1 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1.5 text-sm" /></div>
          </div>
          <div>
            <label class="text-xs font-semibold text-zinc-500 uppercase">Cuerpo del guion</label>
            <textarea id="g-cuerpo" rows="6" placeholder="Escribe el desarrollo…" class="mt-1 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm">${prefill.cuerpo || ''}</textarea>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <button id="g-save" class="flex-1 bg-grass-600 hover:bg-grass-500 text-white font-semibold rounded-xl px-4 py-2.5 text-sm">Guardar guion</button>
            <button id="g-tocal" class="flex-1 border border-grass-600 text-grass-600 hover:bg-grass-50 dark:hover:bg-zinc-800 font-semibold rounded-xl px-4 py-2.5 text-sm">Guardar → Calendario</button>
          </div>
          <p class="text-xs text-zinc-400">El calendario se llena solo desde aquí con el gancho + ángulo.</p>
        </div>
      </div>
    </div>`);

  panel.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => panel.remove()));

  const collect = () => ({
    titulo: (panel.querySelector('#g-template').value || 'Guion nuevo')
      .replace('[X]', panel.querySelector('#g-x').value || '[X]')
      .replace('[Y]', panel.querySelector('#g-y').value || '[Y]')
      .replace('[número]', panel.querySelector('#g-n').value || '[número]'),
    hookId: prefill.hookId || null,
    template: panel.querySelector('#g-template').value,
    angulo: panel.querySelector('#g-angulo').value,
    x: panel.querySelector('#g-x').value, y: panel.querySelector('#g-y').value,
    numero: panel.querySelector('#g-n').value,
    cuerpo: panel.querySelector('#g-cuerpo').value,
  });

  panel.querySelector('#g-save').onclick = async () => {
    await api.addScript(collect());
    toast('Guion guardado');
    panel.remove();
    if (location.hash.includes('calendario')) router();
  };
  panel.querySelector('#g-tocal').onclick = async () => {
    const s = await api.addScript(collect());
    await api.calendarFromScript(s.id, { plataformas: ['instagram', 'tiktok'] });
    toast('Agendado en el calendario');
    panel.remove();
    if (location.hash.includes('calendario')) router();
  };

  document.body.appendChild(panel);
}
window.openGuion = openGuion; // accesible desde las secciones

layout();
window.addEventListener('hashchange', router);
router();
