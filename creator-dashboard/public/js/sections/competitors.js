// Rastreador de competencia: cada domingo levanta los reels más vistos de las 8
// cuentas, transcribe el audio, saca gancho + texto en pantalla, ordena por
// vistas, muestra @ y seguidores, y permite guardar directo al baúl.
import { api } from '../api.js';
import { fmt, card, sectionHeader, spinner, toast } from '../ui.js';

export async function renderCompetitors(view) {
  view.innerHTML = sectionHeader('Rastreador de competencia',
    'Los reels que más rompen de las cuentas que sigues. Se actualiza cada domingo a la mañana.',
    `<button id="refresh" class="bg-grass-600 hover:bg-grass-500 text-white font-semibold rounded-xl px-4 py-2 text-sm">↻ Correr ahora</button>`
  ) + `<div id="accounts" class="mb-6"></div><div id="reels">${spinner}</div>`;

  view.querySelector('#refresh').onclick = async () => {
    view.querySelector('#reels').innerHTML = spinner;
    await api.refreshCompetitors();
    toast('Competencia actualizada');
    load(view);
  };
  await load(view);
}

async function load(view) {
  const { cuentas, reels, semana } = await api.competitors();

  view.querySelector('#accounts').innerHTML = `
    <div class="flex flex-wrap gap-2">
      ${cuentas.map((c) => `
        <span class="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <b>${c.handle}</b> <span class="text-zinc-400">· ${fmt(c.seguidores)}</span>
        </span>`).join('')}
    </div>
    <p class="text-xs text-zinc-400 mt-2">Semana del ${semana} · ${cuentas.length} cuentas · ${reels.length} reels</p>`;

  view.querySelector('#reels').innerHTML = reels.map((r, i) => reelCard(r, i + 1)).join('');
  view.querySelectorAll('[data-vault]').forEach((b) => (b.onclick = async () => {
    b.disabled = true; b.textContent = 'Guardando…';
    await api.competitorToVault(b.dataset.vault);
    toast('Guardado en el baúl 🪝');
    load(view);
  }));
}

function reelCard(r, rank) {
  return card(`
    <div class="p-4 mb-2 flex gap-4">
      <div class="text-xl font-black text-zinc-300 dark:text-zinc-600 w-7 shrink-0">#${rank}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm"><b>${r.handle}</b> <span class="text-zinc-400">· ${fmt(r.seguidores)} seg. · ${r.nicho}</span></div>
          <div class="text-right shrink-0"><span class="font-bold">${fmt(r.vistas)}</span> <span class="text-xs text-zinc-400">vistas</span></div>
        </div>
        <div class="mt-3 grid sm:grid-cols-2 gap-3">
          <div class="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3">
            <div class="text-[11px] font-semibold text-zinc-500 uppercase mb-1">🎙️ Audio (transcrito)</div>
            <p class="text-sm text-zinc-600 dark:text-zinc-300">"${r.audio}"</p>
          </div>
          <div class="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3">
            <div class="text-[11px] font-semibold text-zinc-500 uppercase mb-1">📝 Texto en pantalla</div>
            <p class="text-sm font-bold">${r.textoPantalla}</p>
            <div class="mt-2 text-[11px] font-semibold text-zinc-500 uppercase mb-1">Gancho detectado</div>
            <p class="font-mono text-grass-500 text-sm">${r.gancho}</p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <span class="text-xs text-zinc-400">${r.fecha}</span>
          ${r.guardadoEnBaul
            ? `<span class="text-xs text-grass-500 font-semibold">✓ en el baúl</span>`
            : `<button data-vault="${r.id}" class="bg-grass-600 hover:bg-grass-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5">Guardar en el baúl 🪝</button>`}
        </div>
      </div>
    </div>`);
}
