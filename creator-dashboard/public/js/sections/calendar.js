// Calendario de contenido: se llena solo desde /guion con ganchos y ángulos.
import { api } from '../api.js';
import { card, platformPill, sectionHeader, spinner, toast } from '../ui.js';

const DOW = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

export async function renderCalendar(view) {
  view.innerHTML = sectionHeader('Calendario de contenido',
    'Se llena solo desde /guion con el gancho y el ángulo de cada pieza.',
    `<button id="open-guion" class="bg-grass-600 hover:bg-grass-500 text-white font-semibold rounded-xl px-4 py-2 text-sm">+ Nuevo guion → agenda</button>`
  ) + `<div id="list">${spinner}</div>`;
  view.querySelector('#open-guion').onclick = () => window.openGuion({});
  await load(view);
}

async function load(view) {
  const cal = (await api.calendar()).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const list = view.querySelector('#list');
  if (!cal.length) {
    list.innerHTML = `<div class="text-center py-16 text-zinc-400">
      <p class="text-4xl mb-2">🗓️</p>
      <p>Vacío por ahora.</p>
      <p class="text-sm">Abre <b>/guion</b> (botón "Usar este" en el baúl) y guárdalo al calendario.</p>
    </div>`;
    return;
  }

  // agrupar por semana (lunes)
  list.innerHTML = `<div class="space-y-3">${cal.map(entryRow).join('')}</div>`;
  list.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    await api.delCalendar(b.dataset.del); toast('Quitado del calendario'); load(view);
  }));
}

function entryRow(e) {
  const d = new Date(e.fecha + 'T00:00:00');
  const dow = DOW[(d.getDay() + 6) % 7];
  const dia = d.getDate();
  const mes = d.toLocaleDateString('es', { month: 'short' });
  return card(`
    <div class="p-4 flex items-center gap-4">
      <div class="text-center w-14 shrink-0">
        <div class="text-[11px] uppercase text-zinc-400">${dow}</div>
        <div class="text-2xl font-black text-grass-500 leading-none">${dia}</div>
        <div class="text-[11px] text-zinc-400">${mes}</div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold truncate">${e.titulo}</p>
        <div class="flex flex-wrap items-center gap-2 mt-1.5">
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-grass-500/15 text-grass-600">ángulo: ${e.angulo}</span>
          ${(e.plataformas || []).map(platformPill).join('')}
          <span class="text-[11px] text-zinc-400">· ${e.origen}</span>
        </div>
      </div>
      <span class="text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 shrink-0">${e.estado}</span>
      <button data-del="${e.id}" class="text-zinc-400 hover:text-red-500 text-xs shrink-0">borrar</button>
    </div>`);
}
