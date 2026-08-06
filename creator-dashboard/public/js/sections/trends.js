// Tendencias: lo nuevo de IA de 12 fuentes, filtrado por lo que sirve para contenido.
import { api } from '../api.js';
import { card, sectionHeader, spinner, toast } from '../ui.js';

let soloUtil = true;

export async function renderTrends(view) {
  view.innerHTML = sectionHeader('Tendencias',
    'Lo nuevo en entrenamiento, nutrición e IA de 12 fuentes, filtrado por lo que sirve para tu contenido.',
    `<div class="flex items-center gap-2">
       <label class="flex items-center gap-2 text-sm select-none cursor-pointer">
         <input id="t-util" type="checkbox" ${soloUtil ? 'checked' : ''} class="accent-grass-600 w-4 h-4" /> Solo lo que sirve
       </label>
       <button id="t-refresh" class="bg-grass-600 hover:bg-grass-500 text-white font-semibold rounded-xl px-4 py-2 text-sm">↻ Actualizar</button>
     </div>`
  ) + `<div id="list">${spinner}</div>`;

  view.querySelector('#t-util').onchange = (e) => { soloUtil = e.target.checked; load(view); };
  view.querySelector('#t-refresh').onclick = async () => {
    await api.refreshTrends(); toast('Fuentes actualizadas'); load(view);
  };
  await load(view);
}

async function load(view) {
  const { items, totalFuentes, actualizado } = await api.trends(soloUtil);
  const list = view.querySelector('#list');
  list.innerHTML = `
    <p class="text-xs text-zinc-400 mb-3">${totalFuentes} fuentes · ${items.length} items · al ${actualizado}</p>
    <div class="grid gap-3 md:grid-cols-2">${items.map(trendCard).join('')}</div>`;

  list.querySelectorAll('[data-idea]').forEach((b) => (b.onclick = () => {
    window.openGuion({ template: b.dataset.idea, angulo: 'tendencia IA' });
  }));
}

function trendCard(t) {
  return card(`
    <div class="p-4 flex flex-col h-full">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400">${t.fuente}</span>
        ${t.util ? `<span class="text-[11px] font-semibold text-grass-500">✓ sirve</span>` : `<span class="text-[11px] text-zinc-400">informativo</span>`}
      </div>
      <p class="mt-2 font-semibold text-sm leading-snug">${t.titulo}</p>
      ${t.util && t.ideaContenido ? `
        <div class="mt-2 rounded-lg bg-grass-50 dark:bg-zinc-800 p-2.5">
          <div class="text-[11px] font-semibold uppercase text-zinc-500 mb-0.5">💡 Idea de contenido</div>
          <p class="text-sm text-zinc-600 dark:text-zinc-300">${t.ideaContenido}</p>
        </div>` : ''}
      <div class="mt-auto pt-3 flex items-center justify-between">
        <span class="text-[11px] text-zinc-400">${t.fecha}</span>
        ${t.util && t.ideaContenido ? `<button data-idea="${t.ideaContenido.replace(/"/g, '&quot;')}" class="text-xs font-semibold text-grass-600 dark:text-grass-400 hover:underline">Llevar a /guion →</button>` : ''}
      </div>
    </div>`);
}
