// Baúl de ganchos: búsqueda por nicho/tipo/vistas, plantilla, autor original,
// vistas, y botón "Usar este" que abre el panel /guion a la derecha.
import { api } from '../api.js';
import { fmt, el, card, sectionHeader, spinner, toast } from '../ui.js';

let state = { q: '', nicho: '', tipo: '', orden: 'vistas' };

const TIPO_COLOR = {
  polemico: 'bg-red-500/15 text-red-500',
  listicle: 'bg-blue-500/15 text-blue-500',
  consejo: 'bg-amber-500/15 text-amber-600',
  review: 'bg-purple-500/15 text-purple-500',
  otro: 'bg-zinc-500/15 text-zinc-400',
};

export async function renderHooks(view) {
  view.innerHTML = sectionHeader(
    'Baúl de ganchos',
    'Cada gancho guardado se transcribe y queda como plantilla lista para reusar.',
    `<button id="add-hook" class="bg-grass-600 hover:bg-grass-500 text-white font-semibold rounded-xl px-4 py-2 text-sm">+ Transcribir gancho</button>`
  ) + `<div id="filters"></div><div id="list">${spinner}</div>`;

  view.querySelector('#add-hook').onclick = () => openTranscribe(view);
  await load(view);
}

async function load(view) {
  const qs = '?' + new URLSearchParams(state).toString();
  const { hooks, nichos, tipos } = await api.hooks(qs);

  view.querySelector('#filters').innerHTML = `
    <div class="flex flex-wrap gap-2 mb-5">
      <input id="f-q" value="${state.q}" placeholder="Buscar gancho…" class="flex-1 min-w-[180px] rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm" />
      <select id="f-nicho" class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm">
        <option value="">Todos los nichos</option>
        ${nichos.map((n) => `<option ${state.nicho === n ? 'selected' : ''}>${n}</option>`).join('')}
      </select>
      <select id="f-tipo" class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm">
        <option value="">Todos los tipos</option>
        ${tipos.map((t) => `<option ${state.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <select id="f-orden" class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm">
        <option value="vistas" ${state.orden === 'vistas' ? 'selected' : ''}>Más vistas</option>
        <option value="reciente" ${state.orden === 'reciente' ? 'selected' : ''}>Más reciente</option>
      </select>
    </div>`;

  const f = view.querySelector('#filters');
  f.querySelector('#f-q').oninput = (e) => { state.q = e.target.value; debounced(view); };
  f.querySelector('#f-nicho').onchange = (e) => { state.nicho = e.target.value; load(view); };
  f.querySelector('#f-tipo').onchange = (e) => { state.tipo = e.target.value; load(view); };
  f.querySelector('#f-orden').onchange = (e) => { state.orden = e.target.value; load(view); };

  const list = view.querySelector('#list');
  if (!hooks.length) { list.innerHTML = `<p class="text-zinc-400 py-10 text-center">Sin ganchos para ese filtro.</p>`; return; }

  list.innerHTML = `<div class="grid gap-3 md:grid-cols-2">${hooks.map(hookCard).join('')}</div>`;
  list.querySelectorAll('[data-use]').forEach((b) => (b.onclick = () => {
    const h = hooks.find((x) => x.id === b.dataset.use);
    window.openGuion({ template: h.template, hookId: h.id, angulo: h.tipo });
  }));
  list.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    await api.delHook(b.dataset.del); toast('Gancho borrado'); load(view);
  }));
}

let t;
function debounced(view) { clearTimeout(t); t = setTimeout(() => load(view), 250); }

function hookCard(h) {
  const tc = TIPO_COLOR[h.tipo] || TIPO_COLOR.otro;
  return card(`
    <div class="p-4 flex flex-col h-full">
      <div class="flex items-start justify-between gap-2">
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${tc}">${h.tipo}</span>
        <span class="text-[11px] text-zinc-400">${h.nicho}</span>
      </div>
      <p class="mt-2 font-mono text-grass-500 font-semibold text-sm">${h.template}</p>
      <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300 italic">"${h.original}"</p>
      <div class="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <span title="Quién lo hizo primero">👑 ${h.autor} ${h.autorHandle ? `· ${h.autorHandle}` : ''}</span>
      </div>
      <div class="mt-auto pt-3 flex items-center justify-between">
        <div class="text-xs text-zinc-500">
          <span class="font-bold text-zinc-800 dark:text-zinc-100">${fmt(h.vistas)}</span> vistas
          <span class="ml-1 text-zinc-400">· 1º el ${h.primeroEn}</span>
        </div>
        <div class="flex gap-1.5">
          <button data-del="${h.id}" class="text-zinc-400 hover:text-red-500 text-xs px-2 py-1">borrar</button>
          <button data-use="${h.id}" class="bg-grass-600 hover:bg-grass-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5">Usar este →</button>
        </div>
      </div>
    </div>`, 'hover:border-grass-500/50 transition');
}

// Modal: subir audio (Whisper/AssemblyAI) o pegar texto → plantilla → guardar
async function openTranscribe(view) {
  const status = await api.transcribeStatus().catch(() => ({ audio: false }));
  const audioOn = !!status.audio;

  const m = el(`
    <div class="fixed inset-0 z-40 grid place-items-center p-4">
      <div class="absolute inset-0 bg-black/40" data-close></div>
      <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <h2 class="font-bold text-lg">Transcribir gancho</h2>

        <div class="rounded-xl border border-dashed ${audioOn ? 'border-grass-500/60' : 'border-zinc-300 dark:border-zinc-700'} p-4 text-center">
          ${audioOn
            ? `<p class="text-sm text-zinc-500 mb-2">🎙️ Sube el audio/clip del reel y se transcribe solo <span class="text-grass-500 font-semibold">(${status.provider})</span></p>
               <input id="t-audio" type="file" accept="audio/*,video/*" class="block w-full text-sm text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-grass-600 file:text-white file:font-semibold hover:file:bg-grass-500" />
               <div id="t-audio-state" class="text-xs text-zinc-400 mt-2"></div>`
            : `<p class="text-sm text-zinc-500">Transcripción de audio inactiva. Define <code class="text-grass-500">OPENAI_API_KEY</code> o <code class="text-grass-500">ASSEMBLYAI_API_KEY</code> en <code>creator-dashboard/.env</code> para subir audio. Mientras tanto, pega el texto abajo.</p>`}
        </div>

        <div class="relative text-center"><span class="text-xs text-zinc-400 bg-white dark:bg-zinc-900 px-2">o pega el texto</span><hr class="border-zinc-200 dark:border-zinc-800 -mt-2"/></div>

        <textarea id="t-text" rows="3" placeholder="ej: ChatGPT acaba de matar a los community managers" class="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm"></textarea>
        <div id="t-preview" class="text-sm hidden rounded-xl bg-grass-50 dark:bg-zinc-800 p-3"></div>
        <div class="grid grid-cols-2 gap-2">
          <input id="t-autor" placeholder="Autor (quién lo hizo 1º)" class="rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm" />
          <input id="t-vistas" type="number" placeholder="Vistas" class="rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm" />
        </div>
        <div class="flex gap-2 justify-end pt-1">
          <button data-close class="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700">Cancelar</button>
          <button id="t-save" class="px-4 py-2 text-sm rounded-xl bg-grass-600 hover:bg-grass-500 text-white font-semibold">Guardar en el baúl</button>
        </div>
      </div>
    </div>`);
  m.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => m.remove()));

  const ta = m.querySelector('#t-text');
  const prev = m.querySelector('#t-preview');
  let last = null;

  const showPreview = (r) => {
    prev.hidden = false;
    prev.innerHTML = `<span class="font-semibold">Plantilla:</span> <span class="font-mono text-grass-600 dark:text-grass-400">${r.template}</span>
      <span class="ml-2 text-xs text-zinc-500">tipo: ${r.tipo} · nicho: ${r.nicho}${r.provider ? ' · vía ' + r.provider : ''}</span>`;
  };

  // audio → transcribe en el server → rellena el textarea + preview
  const audioInput = m.querySelector('#t-audio');
  if (audioInput) audioInput.onchange = async () => {
    const file = audioInput.files[0];
    if (!file) return;
    const state = m.querySelector('#t-audio-state');
    state.textContent = 'Transcribiendo… (puede tardar según la duración)';
    try {
      last = await api.transcribeAudio(file);
      ta.value = last.text || '';
      state.innerHTML = `<span class="text-grass-500">✓ Transcrito</span>`;
      showPreview(last);
    } catch (e) {
      state.innerHTML = `<span class="text-red-500">Error: ${e.message}</span>`;
    }
  };

  ta.oninput = async () => {
    if (!ta.value.trim()) { prev.hidden = true; return; }
    last = await api.transcribe(ta.value);
    showPreview(last);
  };

  m.querySelector('#t-save').onclick = async () => {
    if (!ta.value.trim()) return toast('Sube un audio o pega el texto primero', 'err');
    await api.addHook({
      original: ta.value, template: last?.template, tipo: last?.tipo, nicho: last?.nicho,
      autor: m.querySelector('#t-autor').value || 'Yo',
      vistas: Number(m.querySelector('#t-vistas').value) || 0,
    });
    toast('Guardado en el baúl'); m.remove(); load(view);
  };
  document.body.appendChild(m);
}
