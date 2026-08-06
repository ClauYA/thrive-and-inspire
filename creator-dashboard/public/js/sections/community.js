// Community manager — modo "copiar y publicar" (sin configuración):
// arma el caption por plataforma desde un gancho del baúl, lo copiás con un clic
// y se abre la app lista para pegar y publicar. Cero APIs, cero cuentas dev.
import { api } from '../api.js';
import { el, card, platformPill, sectionHeader, spinner, toast } from '../ui.js';

const PLATAFORMAS = ['instagram', 'tiktok', 'youtube', 'x'];
const ICON = { instagram: '📸', tiktok: '🎵', youtube: '▶️', x: '𝕏' };

// dónde abrir cada app para publicar (X acepta el texto pre-cargado)
const OPEN = {
  instagram: () => 'https://www.instagram.com/',
  tiktok: () => 'https://www.tiktok.com/upload',
  youtube: () => 'https://studio.youtube.com/',
  x: (caption) => 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(caption || ''),
};

async function copy(text) {
  try { await navigator.clipboard.writeText(text || ''); toast('Caption copiado 📋'); }
  catch { toast('No pude copiar — copialo a mano', 'err'); }
}

export async function renderCommunity(view) {
  view.innerHTML = sectionHeader('Community manager',
    'Arma el caption desde un gancho, copialo de un clic y se abre la app lista para pegar y publicar.',
    `<button id="new-post" class="bg-grass-600 hover:bg-grass-500 text-white font-semibold rounded-xl px-4 py-2 text-sm">+ Nueva publicación</button>`
  ) + `<div class="mb-5 rounded-xl border border-grass-500/30 bg-grass-500/5 px-4 py-3 text-sm">
        Tocá <b>👁 Vista previa</b> en cualquier publicación: ahí copiás el caption de cada plataforma y abrís la app para pegar. Sin conectar nada.
       </div><div id="list">${spinner}</div>`;
  view.querySelector('#new-post').onclick = () => openComposer(view);
  await load(view);
}

async function load(view) {
  const posts = (await api.posts()).sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
  const list = view.querySelector('#list');
  if (!posts.length) { list.innerHTML = `<p class="text-zinc-400 py-10 text-center">Aún no hay publicaciones.</p>`; return; }
  list.innerHTML = `<div class="space-y-3">${posts.map(postCard).join('')}</div>`;

  list.querySelectorAll('[data-prev]').forEach((b) => (b.onclick = () => {
    openPreview(view, posts.find((p) => p.id === b.dataset.prev));
  }));
  list.querySelectorAll('[data-pub]').forEach((b) => (b.onclick = () => marcarPublicado(view, b.dataset.pub, b)));
  list.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    await api.delPost(b.dataset.del); toast('Borrado'); load(view);
  }));
}

// "Marcar como publicado": vos publicás en la app y acá lo das por hecho.
async function marcarPublicado(view, id, btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }
  try { await api.publishPost(id); toast('Marcado como publicado ✓'); }
  catch (e) { toast('Error: ' + e.message, 'err'); }
  load(view);
}

function postCard(p) {
  const done = p.estado === 'publicado';
  return card(`
    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-semibold truncate">${p.titulo || '(sin título)'}</p>
          ${p.gancho ? `<p class="text-xs font-mono text-grass-500 mt-0.5 truncate">🪝 ${p.gancho}</p>` : ''}
          <div class="flex flex-wrap gap-1.5 mt-2">${(p.plataformas || []).map(platformPill).join('')}</div>
        </div>
        <span class="text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${done ? 'bg-grass-500/15 text-grass-500' : 'bg-amber-500/15 text-amber-600'}">${done ? '✓ publicado' : 'borrador'}</span>
      </div>
      <div class="mt-3 flex items-center justify-between gap-2">
        <span class="text-xs text-zinc-400">${p.programado ? 'Programado: ' + p.programado : 'Sin programar'}${p.nicho ? ' · ' + p.nicho : ''}</span>
        <div class="flex gap-1.5">
          <button data-del="${p.id}" class="text-zinc-400 hover:text-red-500 text-xs px-2 py-1">borrar</button>
          <button data-prev="${p.id}" class="bg-grass-600 hover:bg-grass-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5">👁 Copiar y publicar</button>
        </div>
      </div>
    </div>`);
}

// ─────────── Vista previa: cómo se ve la publicación en cada plataforma ───────────
function openPreview(view, p) {
  const desc = p.descripciones || {};
  const done = p.estado === 'publicado';
  const m = el(`
    <div class="fixed inset-0 z-40 grid place-items-center p-4">
      <div class="absolute inset-0 bg-black/40" data-close></div>
      <div class="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-lg">Vista previa</h2>
          <button data-close class="text-2xl leading-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">×</button>
        </div>
        <div class="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
          <div class="font-semibold">${p.titulo || '(sin título)'}</div>
          ${p.gancho ? `<div class="mt-1 text-xs"><span class="text-zinc-500">Gancho:</span> <span class="font-mono text-grass-500">${p.gancho}</span></div>` : ''}
          <div class="mt-1 text-xs text-zinc-500">${p.nicho ? 'Nicho: ' + p.nicho + ' · ' : ''}${p.programado ? 'Programado: ' + p.programado : 'Sin programar'}</div>
          ${p.mediaUrl ? `<div class="mt-1 text-xs text-zinc-500">Media: <a href="${p.mediaUrl}" target="_blank" class="text-grass-500 underline break-all">${p.mediaUrl}</a></div>` : ''}
        </div>
        <p class="text-xs text-zinc-500">Copiá el caption de cada plataforma y tocá <b>Abrir</b> para pegarlo y publicar. En X ya se carga el texto solo.</p>
        <div class="grid sm:grid-cols-2 gap-3">
          ${(p.plataformas || []).map((plat) => previewCard(plat, p.titulo, desc[plat])).join('')}
        </div>
        <div class="flex items-center justify-between pt-1">
          ${done ? `<span class="text-xs font-semibold text-grass-500">✓ Marcado como publicado</span>`
                 : `<button id="p-pub" class="border border-grass-600 text-grass-600 hover:bg-grass-50 dark:hover:bg-zinc-800 font-semibold rounded-xl px-4 py-2 text-sm">Marcar como publicado ✓</button>`}
        </div>
      </div>
    </div>`);
  m.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => m.remove()));
  // botones por plataforma: copiar caption / abrir app
  m.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copy(desc[b.dataset.copy])));
  m.querySelectorAll('[data-open]').forEach((b) => (b.onclick = async () => {
    const plat = b.dataset.open;
    await copy(desc[plat]);                       // copia primero, así solo pegás
    window.open(OPEN[plat]?.(desc[plat]) || '#', '_blank');
  }));
  m.querySelector('#p-pub')?.addEventListener('click', async () => {
    await marcarPublicado(view, p.id, m.querySelector('#p-pub'));
    m.remove();
  });
  document.body.appendChild(m);
}

// tarjeta tipo "post" para una plataforma, con copiar / abrir app
function previewCard(plat, titulo, caption) {
  return `
    <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col">
      <div class="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
        <span>${ICON[plat] || '📱'}</span>
        <span class="text-sm font-semibold capitalize">${plat}</span>
      </div>
      <div class="aspect-[4/5] bg-gradient-to-br from-grass-500/20 to-zinc-200 dark:to-zinc-900 grid place-items-center p-3 text-center">
        <span class="text-sm font-bold text-zinc-700 dark:text-zinc-200">${titulo || ''}</span>
      </div>
      <pre class="text-xs whitespace-pre-wrap font-sans text-zinc-600 dark:text-zinc-300 p-3 max-h-32 overflow-y-auto flex-1">${caption || '(sin descripción)'}</pre>
      <div class="flex gap-1.5 p-2 border-t border-zinc-200 dark:border-zinc-700">
        <button data-copy="${plat}" class="flex-1 text-xs font-semibold border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">📋 Copiar</button>
        <button data-open="${plat}" class="flex-1 text-xs font-semibold bg-grass-600 hover:bg-grass-500 text-white rounded-lg px-2 py-1.5">Abrir ${plat} ↗</button>
      </div>
    </div>`;
}

// ─────────── Composer: título + gancho del baúl + plataformas + auto-caption ───────────
async function openComposer(view) {
  let sel = ['instagram', 'tiktok'];
  let descripciones = {};
  let gancho = '';
  let nicho = '';
  const { hooks } = await api.hooks('?orden=vistas').catch(() => ({ hooks: [] }));

  const m = el(`
    <div class="fixed inset-0 z-40 grid place-items-center p-4">
      <div class="absolute inset-0 bg-black/40" data-close></div>
      <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="font-bold text-lg">Nueva publicación</h2>

        <div>
          <label class="text-xs font-semibold text-zinc-500 uppercase">Gancho del baúl <span class="font-normal normal-case text-zinc-400">(opcional)</span></label>
          <select id="c-hook" class="mt-1 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm">
            <option value="">— sin gancho —</option>
            ${hooks.map((h, i) => `<option value="${i}">[${h.nicho}] ${h.original}</option>`).join('')}
          </select>
        </div>

        <input id="c-titulo" placeholder="Título / idea del contenido" class="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm" />

        <div>
          <label class="text-xs font-semibold text-zinc-500 uppercase">Media <span class="font-normal normal-case text-zinc-400">(URL pública de imagen/video — necesaria para publicar de verdad)</span></label>
          <div class="mt-1 flex gap-2">
            <input id="c-media" placeholder="https://…/reel.mp4" class="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-2 text-sm" />
            <select id="c-mediatipo" class="rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-2 text-sm">
              <option value="image">imagen (IG)</option>
              <option value="reels">reel/video</option>
            </select>
          </div>
        </div>

        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase mb-1.5">Plataformas</div>
          <div id="c-plats" class="flex flex-wrap gap-2">
            ${PLATAFORMAS.map((p) => `<button data-p="${p}" class="plat-btn px-3 py-1.5 rounded-xl text-sm border ${sel.includes(p) ? 'bg-grass-600 text-white border-grass-600' : 'border-zinc-300 dark:border-zinc-700'}">${ICON[p]} ${p}</button>`).join('')}
          </div>
        </div>

        <button id="c-auto" class="w-full border border-grass-600 text-grass-600 hover:bg-grass-50 dark:hover:bg-zinc-800 font-semibold rounded-xl px-4 py-2 text-sm">✍️ Escribir descripciones solas</button>
        <div id="c-preview" class="space-y-2"></div>

        <div class="flex gap-2 justify-end pt-1">
          <button data-close class="px-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700">Cancelar</button>
          <button id="c-save" class="px-4 py-2 text-sm rounded-xl bg-grass-600 hover:bg-grass-500 text-white font-semibold">Guardar borrador</button>
        </div>
      </div>
    </div>`);
  m.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => m.remove()));

  // elegir gancho → autocompleta título + nicho
  const hookSel = m.querySelector('#c-hook');
  const tituloIn = m.querySelector('#c-titulo');
  hookSel.onchange = () => {
    const h = hooks[hookSel.value];
    if (h) { gancho = h.original; nicho = h.nicho; if (!tituloIn.value) tituloIn.value = h.original; }
    else { gancho = ''; nicho = ''; }
  };

  m.querySelectorAll('.plat-btn').forEach((b) => (b.onclick = () => {
    const p = b.dataset.p;
    sel = sel.includes(p) ? sel.filter((x) => x !== p) : [...sel, p];
    b.classList.toggle('bg-grass-600'); b.classList.toggle('text-white'); b.classList.toggle('border-grass-600');
  }));

  m.querySelector('#c-auto').onclick = async () => {
    const titulo = tituloIn.value;
    if (!titulo.trim()) return toast('Escribe el título primero', 'err');
    if (!sel.length) return toast('Elige al menos una plataforma', 'err');
    const { descripciones: d } = await api.autodescribe(titulo, sel, gancho, nicho);
    descripciones = d;
    m.querySelector('#c-preview').innerHTML = Object.entries(d).map(([plat, txt]) => `
      <div class="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2.5">
        <div class="text-[11px] font-semibold uppercase text-zinc-500 mb-1">${ICON[plat]} ${plat}</div>
        <pre class="text-xs whitespace-pre-wrap font-sans text-zinc-600 dark:text-zinc-300">${txt}</pre>
      </div>`).join('');
  };

  m.querySelector('#c-save').onclick = async () => {
    const titulo = tituloIn.value;
    if (!titulo.trim()) return toast('Escribe el título', 'err');
    await api.addPost({
      titulo, gancho, nicho, plataformas: sel,
      mediaUrl: m.querySelector('#c-media').value.trim(),
      mediaTipo: m.querySelector('#c-mediatipo').value,
      descripciones: Object.keys(descripciones).length ? descripciones : undefined,
    });
    toast('Borrador guardado'); m.remove(); load(view);
  };
  document.body.appendChild(m);
}
