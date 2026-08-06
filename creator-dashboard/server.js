// API REST + servidor de estáticos del Tablero de Contenido.
// Node + Express (ESM). Sin base de datos: persiste en data/*.json vía store.js.
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as store from './store.js';
import { toTemplate, guessNiche } from './lib/templater.js';
import { transcribeAudio, transcriptionProvider } from './lib/transcribe.js';
import * as yt from './lib/integrations/youtube.js';
import * as ig from './lib/integrations/instagram.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));
// subida de audio en memoria (máx 25 MB, el límite típico de Whisper)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const PORT = process.env.PORT || 4300;
const ok = (res, data) => res.json(data);
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error(e);
    res.status(500).json({ error: e.message });
  });

// ───────────────────────── Baúl de ganchos ─────────────────────────
// GET /api/hooks?q=&nicho=&tipo=&orden=vistas|reciente
app.get('/api/hooks', wrap(async (req, res) => {
  const { q = '', nicho = '', tipo = '', orden = 'vistas' } = req.query;
  let hooks = await store.read('hooks');
  const ql = q.toLowerCase();
  hooks = hooks.filter((h) =>
    (!ql || `${h.original} ${h.template}`.toLowerCase().includes(ql)) &&
    (!nicho || h.nicho === nicho) &&
    (!tipo || h.tipo === tipo));
  hooks.sort((a, b) => (orden === 'reciente'
    ? String(b.primeroEn).localeCompare(String(a.primeroEn))
    : b.vistas - a.vistas));
  // facetas para los filtros del front
  const all = await store.read('hooks');
  ok(res, {
    hooks,
    nichos: [...new Set(all.map((h) => h.nicho))].sort(),
    tipos: [...new Set(all.map((h) => h.tipo))].sort(),
  });
}));

// GET /api/transcribe/status  → ¿hay proveedor de audio configurado?
app.get('/api/transcribe/status', (req, res) =>
  ok(res, { provider: transcriptionProvider(), audio: !!transcriptionProvider() }));

// POST /api/hooks/transcribe
//   - multipart con campo `audio` (archivo)  → transcribe con Whisper/AssemblyAI
//   - JSON { audioUrl }                       → descarga y transcribe
//   - JSON { text }                           → solo plantilla (heurística local)
// Siempre devuelve { text, template, tipo, variables, nicho, provider? }.
app.post('/api/hooks/transcribe', upload.single('audio'), wrap(async (req, res) => {
  let text = (req.body?.text || '').trim();
  let provider;

  if (req.file) {
    const r = await transcribeAudio({ buffer: req.file.buffer, filename: req.file.originalname, mime: req.file.mimetype });
    text = r.text; provider = r.provider;
  } else if (req.body?.audioUrl) {
    const resp = await fetch(req.body.audioUrl);
    if (!resp.ok) return res.status(400).json({ error: `No pude descargar el audio (${resp.status})` });
    const buffer = Buffer.from(await resp.arrayBuffer());
    const filename = req.body.audioUrl.split('/').pop() || 'audio.mp3';
    const r = await transcribeAudio({ buffer, filename, mime: resp.headers.get('content-type') || 'audio/mpeg' });
    text = r.text; provider = r.provider;
  }

  const t = toTemplate(text);
  ok(res, { ...t, text, nicho: guessNiche(text), provider });
}));

// POST /api/hooks { original, nicho?, tipo?, vistas?, autor?, autorHandle?, primeroEn? }
app.post('/api/hooks', wrap(async (req, res) => {
  const b = req.body || {};
  const hooks = await store.read('hooks');
  const t = toTemplate(b.original || '');
  const hook = {
    id: store.nextId(hooks, 'h'),
    original: b.original || '',
    template: b.template || t.template,
    nicho: b.nicho || guessNiche(b.original || ''),
    tipo: b.tipo || t.tipo,
    vistas: Number(b.vistas) || 0,
    autor: b.autor || 'Yo',
    autorHandle: b.autorHandle || '',
    primeroEn: b.primeroEn || new Date().toISOString().slice(0, 10),
    fuente: b.fuente || 'manual',
  };
  hooks.push(hook);
  await store.write('hooks', hooks);
  ok(res, hook);
}));

app.delete('/api/hooks/:id', wrap(async (req, res) => {
  const hooks = await store.read('hooks');
  await store.write('hooks', hooks.filter((h) => h.id !== req.params.id));
  ok(res, { deleted: req.params.id });
}));

// ───────────────────────── Métricas ─────────────────────────
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// GET /api/metrics  → series + sparklines 7/30/90 + top5 reels + alertas
// TODO:integración — hoy lee data/metrics.json; conectar Instagram Graph API.
app.get('/api/metrics', wrap(async (req, res) => {
  const { daily, reels, actualizado } = await store.read('metrics');
  const keys = ['vistas', 'guardados', 'seguidores', 'seguidoresNuevos', 'dms'];
  const last = (n, k) => daily.slice(-n).map((d) => d[k]);
  const tarjetas = keys.map((k) => {
    const total7 = last(7, k);
    const prev7 = daily.slice(-14, -7).map((d) => d[k]);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const cur = k === 'seguidores' ? total7.at(-1) : sum(total7);
    const prev = k === 'seguidores' ? (prev7.at(-1) || cur) : sum(prev7);
    const delta = prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
    return {
      key: k, valor: cur, delta,
      spark: { 7: last(7, k), 30: last(30, k), 90: last(90, k) },
    };
  });
  // Alerta: reel que duplica la mediana de vistas de los últimos 30 días.
  const med30 = median(last(30, 'vistas'));
  const conAlerta = reels.map((r) => ({ ...r, alerta: r.vistas >= med30 * 2, medianaRef: med30 }));
  const top5 = [...conAlerta].sort((a, b) => b.vistas - a.vistas).slice(0, 5);
  ok(res, { actualizado, tarjetas, top5, medianaVistas30: med30 });
}));

// ───────────────────────── Rastreador de competencia ─────────────────────────
// GET /api/competitors
app.get('/api/competitors', wrap(async (req, res) => {
  const data = await store.read('competitors');
  data.reels.sort((a, b) => b.vistas - a.vistas);
  ok(res, data);
}));

// POST /api/competitors/refresh  → simula la corrida de cada domingo
// TODO:integración — programar con cron (domingo AM) + scraping/API de Instagram.
app.post('/api/competitors/refresh', wrap(async (req, res) => {
  const data = await store.read('competitors');
  // simulación: revisa vistas y marca la semana como hoy
  data.reels = data.reels.map((r) => ({
    ...r,
    vistas: Math.max(50000, Math.round(r.vistas * (0.85 + Math.random() * 0.4))),
  }));
  data.semana = new Date().toISOString().slice(0, 10);
  data.reels.sort((a, b) => b.vistas - a.vistas);
  await store.write('competitors', data);
  ok(res, data);
}));

// POST /api/competitors/:id/to-vault  → guarda el gancho del reel en el baúl
app.post('/api/competitors/:id/to-vault', wrap(async (req, res) => {
  const data = await store.read('competitors');
  const reel = data.reels.find((r) => r.id === req.params.id);
  if (!reel) return res.status(404).json({ error: 'reel no encontrado' });
  const hooks = await store.read('hooks');
  const t = toTemplate(reel.textoPantalla || reel.gancho || reel.audio);
  const hook = {
    id: store.nextId(hooks, 'h'),
    original: reel.textoPantalla || reel.audio,
    template: reel.gancho || t.template,
    nicho: reel.nicho || guessNiche(reel.audio),
    tipo: t.tipo,
    vistas: reel.vistas,
    autor: reel.autor,
    autorHandle: reel.handle,
    primeroEn: reel.fecha,
    fuente: 'competencia',
  };
  hooks.push(hook);
  await store.write('hooks', hooks);
  reel.guardadoEnBaul = true;
  await store.write('competitors', data);
  ok(res, hook);
}));

// ───────────────────────── Guiones (/guion) ─────────────────────────
app.get('/api/scripts', wrap(async (req, res) => ok(res, await store.read('scripts'))));

app.post('/api/scripts', wrap(async (req, res) => {
  const b = req.body || {};
  const scripts = await store.read('scripts');
  const s = {
    id: store.nextId(scripts, 'g'),
    titulo: b.titulo || (b.template || 'Guion nuevo'),
    hookId: b.hookId || null,
    template: b.template || '',
    angulo: b.angulo || '',
    x: b.x || '', y: b.y || '', numero: b.numero || '',
    cuerpo: b.cuerpo || '',
    estado: 'borrador',
    creado: new Date().toISOString().slice(0, 10),
  };
  scripts.push(s);
  await store.write('scripts', scripts);
  ok(res, s);
}));

app.put('/api/scripts/:id', wrap(async (req, res) => {
  const scripts = await store.read('scripts');
  const i = scripts.findIndex((s) => s.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'no existe' });
  scripts[i] = { ...scripts[i], ...req.body, id: scripts[i].id };
  await store.write('scripts', scripts);
  ok(res, scripts[i]);
}));

app.delete('/api/scripts/:id', wrap(async (req, res) => {
  const scripts = await store.read('scripts');
  await store.write('scripts', scripts.filter((s) => s.id !== req.params.id));
  ok(res, { deleted: req.params.id });
}));

// ───────────────────────── Calendario de contenido ─────────────────────────
app.get('/api/calendar', wrap(async (req, res) => ok(res, await store.read('calendar'))));

// POST /api/calendar/from-script/:id  → el calendario se llena solo desde /guion
app.post('/api/calendar/from-script/:id', wrap(async (req, res) => {
  const scripts = await store.read('scripts');
  const s = scripts.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'guion no existe' });
  const cal = await store.read('calendar');
  // siguiente hueco: hoy + (cantidad de entradas) días, cada 2 días
  const base = new Date();
  base.setDate(base.getDate() + 1 + cal.length * 2);
  const entry = {
    id: store.nextId(cal, 'cal'),
    fecha: base.toISOString().slice(0, 10),
    titulo: s.titulo,
    hookId: s.hookId,
    angulo: s.angulo || 'sin ángulo',
    plataformas: req.body?.plataformas || ['instagram'],
    estado: 'planeado',
    origen: '/guion',
  };
  cal.push(entry);
  await store.write('calendar', cal);
  ok(res, entry);
}));

app.post('/api/calendar', wrap(async (req, res) => {
  const cal = await store.read('calendar');
  const entry = { id: store.nextId(cal, 'cal'), estado: 'planeado', origen: 'manual', ...req.body };
  cal.push(entry);
  await store.write('calendar', cal);
  ok(res, entry);
}));

app.delete('/api/calendar/:id', wrap(async (req, res) => {
  const cal = await store.read('calendar');
  await store.write('calendar', cal.filter((c) => c.id !== req.params.id));
  ok(res, { deleted: req.params.id });
}));

// ───────────────────────── Community manager ─────────────────────────
const PLATAFORMAS = ['instagram', 'tiktok', 'youtube', 'x'];

// hashtags por nicho (en vez de genéricos)
const HASHTAGS = {
  powerbuilding: '#powerbuilding #fuerza #gym #entrenamiento #strength',
  bodybuilding: '#bodybuilding #hipertrofia #masamuscular #gym #fitness',
  'conscious eating': '#alimentacionconsciente #nutricion #habitossaludables #comidareal',
  'healthy lifestyle': '#vidasana #habitos #bienestar #salud #rutina',
};

// descripciones que "se escriben solas" por plataforma (heurística local).
// TODO:integración — para captions de verdad, llamar a un LLM aquí (ver claude-api).
// opts: { gancho, nicho } — si hay gancho, se usa como primer renglón del caption.
function autoDescribir(titulo, plataformas, opts = {}) {
  const t = (titulo || '').trim();
  const hook = (opts.gancho || '').trim();
  const tags = HASHTAGS[opts.nicho] || '#contenido #fitness #salud';
  const open = hook ? `${hook}\n\n` : '';
  const map = {
    instagram: `${open}${t} 🌱\n\nGuárdalo para tu próxima rutina y contame qué opinás 👇\n\n${tags}`,
    tiktok: `${hook || t} 👀 #fyp #parati ${tags}`,
    youtube: `${t}\n\n${hook ? hook + '\n\n' : ''}En este video te lo explico todo. Suscribite para más.\n\n${tags}`,
    x: `${hook || t}\n\nAbro hilo 🧵👇`,
  };
  const sel = (plataformas?.length ? plataformas : PLATAFORMAS).filter((p) => map[p]);
  return Object.fromEntries(sel.map((p) => [p, map[p]]));
}

app.get('/api/posts', wrap(async (req, res) => ok(res, await store.read('posts'))));

// Estado real de conexión por plataforma.
//   - instagram: configurada si hay IG_USER_ID + IG_ACCESS_TOKEN en .env
//   - youtube:   configurada si hay GOOGLE_CLIENT_ID/SECRET; conectada tras OAuth
//   - tiktok/x:  todavía no implementadas (simuladas)
app.get('/api/posts/accounts', wrap(async (req, res) => {
  const igConf = ig.instagramConfigured();
  const ytConf = yt.youtubeConfigured();
  const ytConn = await yt.youtubeConnected();
  const cuentas = [
    { plataforma: 'instagram', configurada: igConf, conectada: igConf, conectar: null },
    { plataforma: 'youtube', configurada: ytConf, conectada: ytConn, conectar: ytConf && !ytConn ? '/api/connect/youtube' : null },
    { plataforma: 'tiktok', configurada: false, conectada: false, conectar: null, proximamente: true },
    { plataforma: 'x', configurada: false, conectada: false, conectar: null, proximamente: true },
  ];
  ok(res, { demo: !cuentas.some((c) => c.conectada), cuentas });
}));

// ── OAuth de YouTube ──
app.get('/api/connect/youtube', (req, res) => {
  if (!yt.youtubeConfigured()) return res.status(400).send('Falta GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en .env');
  res.redirect(yt.youtubeAuthUrl());
});
app.get('/api/oauth/youtube/callback', wrap(async (req, res) => {
  if (req.query.error) return res.send(`Conexión cancelada: ${req.query.error}`);
  await yt.youtubeExchangeCode(req.query.code);
  // volver al community manager
  res.redirect('/#/community');
}));

// POST /api/posts/autodescribe { titulo, plataformas, gancho?, nicho? }
app.post('/api/posts/autodescribe', wrap(async (req, res) => {
  const { titulo = '', plataformas = [], gancho = '', nicho = '' } = req.body || {};
  ok(res, { descripciones: autoDescribir(titulo, plataformas, { gancho, nicho }) });
}));

app.post('/api/posts', wrap(async (req, res) => {
  const b = req.body || {};
  const posts = await store.read('posts');
  const post = {
    id: store.nextId(posts, 'p'),
    titulo: b.titulo || '',
    gancho: b.gancho || '',
    nicho: b.nicho || '',
    mediaUrl: b.mediaUrl || '',            // URL pública de imagen/video (req. para publicar de verdad)
    mediaTipo: b.mediaTipo || 'image',     // 'image' | 'reels' (IG) — YouTube siempre video
    plataformas: b.plataformas?.length ? b.plataformas : ['instagram'],
    descripciones: b.descripciones || autoDescribir(b.titulo, b.plataformas, { gancho: b.gancho, nicho: b.nicho }),
    estado: 'borrador',
    programado: b.programado || '',
    creado: new Date().toISOString().slice(0, 10),
  };
  posts.push(post);
  await store.write('posts', posts);
  ok(res, post);
}));

// descarga los bytes de una URL pública (para subir el video a YouTube)
async function fetchMedia(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No pude descargar el media (${r.status})`);
  return { buffer: Buffer.from(await r.arrayBuffer()), mime: r.headers.get('content-type') || 'video/mp4' };
}

// publica en UNA plataforma; devuelve { plataforma, ok, simulado, url?, error? }
async function publishTo(plataforma, post) {
  const caption = post.descripciones?.[plataforma] || post.titulo || '';
  try {
    if (plataforma === 'instagram' && ig.instagramConfigured()) {
      const r = await ig.instagramPublish({ mediaUrl: post.mediaUrl, caption, tipo: post.mediaTipo });
      return { plataforma, ok: true, simulado: false, url: r.url, id: r.id };
    }
    if (plataforma === 'youtube' && (await yt.youtubeConnected())) {
      if (!post.mediaUrl) throw new Error('YouTube necesita un video (mediaUrl)');
      const media = await fetchMedia(post.mediaUrl);
      const r = await yt.youtubeUpload({ buffer: media.buffer, mime: media.mime, title: post.titulo, description: caption });
      return { plataforma, ok: true, simulado: false, url: r.url, id: r.id };
    }
  } catch (e) {
    return { plataforma, ok: false, simulado: false, error: e.message };
  }
  // sin credenciales / plataforma no implementada → simulado
  return { plataforma, ok: true, simulado: true };
}

// POST /api/posts/:id/publish  → publica en todas las plataformas de un clic.
// Llama a las APIs reales donde haya credenciales; el resto queda simulado.
app.post('/api/posts/:id/publish', wrap(async (req, res) => {
  const posts = await store.read('posts');
  const p = posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'no existe' });

  const resultados = [];
  for (const plat of p.plataformas || []) resultados.push(await publishTo(plat, p));

  const algunoReal = resultados.some((r) => r.ok && !r.simulado);
  const algunError = resultados.some((r) => !r.ok);
  p.estado = algunError && !algunoReal ? 'error' : 'publicado';
  p.publicadoEn = new Date().toISOString();
  p.simulado = !algunoReal;
  p.resultados = resultados;
  await store.write('posts', posts);
  ok(res, { ...p, aviso: p.simulado ? 'Publicación SIMULADA (sin cuentas conectadas para estas plataformas).' : undefined });
}));

app.delete('/api/posts/:id', wrap(async (req, res) => {
  const posts = await store.read('posts');
  await store.write('posts', posts.filter((p) => p.id !== req.params.id));
  ok(res, { deleted: req.params.id });
}));

// ───────────────────────── Tendencias ─────────────────────────
// GET /api/trends?soloUtil=1
app.get('/api/trends', wrap(async (req, res) => {
  const data = await store.read('trends');
  let items = data.items;
  if (req.query.soloUtil === '1') items = items.filter((i) => i.util);
  ok(res, { ...data, items, totalFuentes: new Set(data.items.map((i) => i.fuente)).size });
}));

// POST /api/trends/refresh  → relee/baraja las 12 fuentes
// TODO:integración — conectar los 12 feeds RSS/APIs reales.
app.post('/api/trends/refresh', wrap(async (req, res) => {
  const data = await store.read('trends');
  data.actualizado = new Date().toISOString().slice(0, 10);
  await store.write('trends', data);
  ok(res, data);
}));

// ───────────────────────── estáticos + fallback SPA ─────────────────────────
const pub = join(__dirname, 'public');
app.use(express.static(pub));
app.get('*', (req, res) => res.sendFile(join(pub, 'index.html')));

app.listen(PORT, () => console.log(`Tablero de contenido en http://localhost:${PORT}`));
