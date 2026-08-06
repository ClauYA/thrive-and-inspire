// Generador de datos semilla determinista — enfocado en los nichos del creador:
//   healthy lifestyle · powerbuilding · bodybuilding · conscious eating
// Correr:  node scripts/seed.mjs           (no pisa archivos existentes)
//          node scripts/seed.mjs --force   (regenera todo)
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const FORCE = process.argv.includes('--force');

const END = new Date('2026-06-25T00:00:00Z');
const DAYS = 90;

// PRNG determinista (mulberry32) para que el seed sea reproducible.
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(7);
const dayMs = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);

function write(name, value) {
  const p = join(dataDir, name);
  if (existsSync(p) && !FORCE) { console.log('skip (existe):', name); return; }
  writeFileSync(p, JSON.stringify(value, null, 2));
  console.log((existsSync(p) ? 'reescrito:' : 'escrito:'), name);
}

// Nichos del creador (se usan en todos los datasets)
const N = { health: 'healthy lifestyle', power: 'powerbuilding', body: 'bodybuilding', food: 'conscious eating' };

// ───────────────────────── Baúl de ganchos ─────────────────────────
write('hooks.json', [
  { id: 'h1', original: 'El cardio en ayunas acaba de matar tu masa muscular', template: '[X] acaba de matar a [Y]', nicho: N.body, tipo: 'polemico', vistas: 1640000, autor: 'Caro Méndez', autorHandle: '@hipertrofiapro', primeroEn: '2026-03-12', fuente: 'reel' },
  { id: 'h2', original: 'Deja de entrenar siempre al fallo', template: 'Deja de hacer [X]', nicho: N.power, tipo: 'consejo', vistas: 980000, autor: 'Martín Solís', autorHandle: '@fuerzareal', primeroEn: '2026-04-02', fuente: 'reel' },
  { id: 'h3', original: '7 cosas que ojalá hubiera sabido antes de empezar a hacer fuerza', template: '[número] cosas que ojalá hubiera sabido', nicho: N.power, tipo: 'listicle', vistas: 1210000, autor: 'Nacho Ríos', autorHandle: '@powerbuildlab', primeroEn: '2026-02-20', fuente: 'reel' },
  { id: 'h4', original: 'Probé comer 200g de proteína al día durante 30 días y esto pasó', template: 'Probé [X] durante [tiempo] y esto pasó', nicho: N.body, tipo: 'review', vistas: 870000, autor: 'Tomás León', autorHandle: '@masamuscular', primeroEn: '2026-05-08', fuente: 'reel' },
  { id: 'h5', original: 'Deja de contar calorías a ojo', template: 'Deja de hacer [X]', nicho: N.food, tipo: 'consejo', vistas: 640000, autor: 'Sofía Vidal', autorHandle: '@nutricion.simple', primeroEn: '2026-04-19', fuente: 'reel' },
  { id: 'h6', original: 'Los ultraprocesados acaban de matar tu progreso', template: '[X] acaba de matar a [Y]', nicho: N.food, tipo: 'polemico', vistas: 1120000, autor: 'Lucía Fit', autorHandle: '@comeconsciente', primeroEn: '2026-05-30', fuente: 'reel' },
  { id: 'h7', original: '5 cosas que ojalá hubiera sabido sobre dormir y entrenar', template: '[número] cosas que ojalá hubiera sabido', nicho: N.health, tipo: 'listicle', vistas: 720000, autor: 'Vale Cruz', autorHandle: '@habitos.fuertes', primeroEn: '2026-05-15', fuente: 'reel' },
  { id: 'h8', original: 'Deja de desayunar apenas te levantas', template: 'Deja de hacer [X]', nicho: N.health, tipo: 'consejo', vistas: 560000, autor: 'Diego Bravo', autorHandle: '@vidasana.diaria', primeroEn: '2026-06-01', fuente: 'reel' },
  { id: 'h9', original: 'La báscula acaba de matar tu motivación', template: '[X] acaba de matar a [Y]', nicho: N.health, tipo: 'polemico', vistas: 430000, autor: 'Vale Cruz', autorHandle: '@habitos.fuertes', primeroEn: '2026-06-10', fuente: 'reel' },
  { id: 'h10', original: 'Probé entrenar en bloque de powerbuilding durante 12 semanas y esto pasó', template: 'Probé [X] durante [tiempo] y esto pasó', nicho: N.power, tipo: 'review', vistas: 510000, autor: 'Martín Solís', autorHandle: '@fuerzareal', primeroEn: '2026-06-05', fuente: 'reel' },
]);

// ───────────────────────── Métricas ─────────────────────────
const daily = [];
let seguidores = 38200;
for (let i = DAYS - 1; i >= 0; i--) {
  const date = iso(END.getTime() - i * dayMs);
  const dow = new Date(date).getUTCDay();
  const weekendBoost = dow === 0 || dow === 6 ? 1.25 : 1;
  const base = 1 + 0.4 * Math.sin((DAYS - i) / 6) + (r() - 0.5) * 0.5;
  const vistas = Math.round(42000 * base * weekendBoost);
  const guardados = Math.round(vistas * (0.018 + r() * 0.01));
  const nuevos = Math.round(60 + vistas / 900 + (r() - 0.4) * 80);
  seguidores += Math.max(0, nuevos - Math.round(r() * 25));
  const dms = Math.round(40 + vistas / 2500 + (r() - 0.5) * 30);
  daily.push({ date, vistas, guardados, seguidores, seguidoresNuevos: Math.max(0, nuevos), dms: Math.max(0, dms) });
}
write('metrics.json', {
  actualizado: iso(END), daily,
  reels: [
    { id: 'r1', titulo: 'El cardio en ayunas mata tu masa muscular', nicho: N.body, fecha: '2026-06-22', vistas: 1640000, guardados: 38200, porque: 'Gancho polémico que ataca una creencia común del gym: alto share por debate.' },
    { id: 'r2', titulo: '7 cosas que ojalá hubiera sabido antes de hacer fuerza', nicho: N.power, fecha: '2026-06-19', vistas: 960000, guardados: 31200, porque: 'Listicle con promesa clara; guardado altísimo porque es “para mi próxima rutina”.' },
    { id: 'r3', titulo: 'Deja de entrenar siempre al fallo', nicho: N.power, fecha: '2026-06-17', vistas: 740000, guardados: 18900, porque: 'Contradice el “sin dolor no hay ganancia”; retención alta en los primeros 3s.' },
    { id: 'r4', titulo: 'Probé 200g de proteína al día por 30 días', nicho: N.body, fecha: '2026-06-14', vistas: 560000, guardados: 24100, porque: 'Reto medible + before/after; se guarda para replicar el experimento.' },
    { id: 'r5', titulo: 'Lo que nadie te dice del déficit calórico', nicho: N.food, fecha: '2026-06-11', vistas: 470000, guardados: 21800, porque: 'Curiosidad + tema de pérdida de grasa; comentarios pidiendo la parte 2.' },
    { id: 'r6', titulo: 'Mi rutina de powerbuilding en 45 min', nicho: N.power, fecha: '2026-06-08', vistas: 320000, guardados: 14200, porque: 'Valor práctico inmediato; se guarda para usar en el gym.' },
  ],
});

// ───────────────────────── Rastreador de competencia ─────────────────────────
const cuentas = [
  { handle: '@fuerzareal', nombre: 'Martín Solís', seguidores: 412000, nicho: N.power },
  { handle: '@hipertrofiapro', nombre: 'Caro Méndez', seguidores: 386000, nicho: N.body },
  { handle: '@comeconsciente', nombre: 'Lucía Fit', seguidores: 298000, nicho: N.food },
  { handle: '@vidasana.diaria', nombre: 'Diego Bravo', seguidores: 233000, nicho: N.health },
  { handle: '@powerbuildlab', nombre: 'Nacho Ríos', seguidores: 339000, nicho: N.power },
  { handle: '@nutricion.simple', nombre: 'Sofía Vidal', seguidores: 198000, nicho: N.food },
  { handle: '@masamuscular', nombre: 'Tomás León', seguidores: 451000, nicho: N.body },
  { handle: '@habitos.fuertes', nombre: 'Vale Cruz', seguidores: 176000, nicho: N.health },
];
const transAngulos = [
  { audio: 'Mucha gente entrena cada serie al fallo pensando que crece más, y la verdad es que te frena la recuperación…', gancho: 'Deja de hacer [X]', textoPantalla: 'DEJA DE IR AL FALLO' },
  { audio: 'Esto suena fuerte, pero el cardio en ayunas no te va a quemar más grasa y sí te puede costar músculo…', gancho: '[X] acaba de matar a [Y]', textoPantalla: 'CARDIO EN AYUNAS' },
  { audio: 'Si volviera a empezar a entrenar fuerza, hay siete cosas que me hubieran ahorrado años…', gancho: '[número] cosas que ojalá hubiera sabido', textoPantalla: '7 COSAS' },
  { audio: 'Dejá de calcular las calorías a ojo, porque casi siempre te quedás corto o te pasás sin darte cuenta…', gancho: 'Deja de hacer [X]', textoPantalla: 'NO CUENTES A OJO' },
  { audio: 'Comí doscientos gramos de proteína por día durante un mes entero y esto fue lo que pasó con mi físico…', gancho: 'Probé [X] durante [tiempo] y esto pasó', textoPantalla: '200G PROTEÍNA / 30 DÍAS' },
];
const competidores = [];
let cid = 1;
for (const c of cuentas) {
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const t = transAngulos[Math.floor(r() * transAngulos.length)];
    competidores.push({
      id: 'c' + cid++,
      handle: c.handle, autor: c.nombre, seguidores: c.seguidores, nicho: c.nicho,
      vistas: Math.round(150000 + r() * 1900000),
      fecha: iso(END.getTime() - Math.floor(r() * 6) * dayMs),
      audio: t.audio, gancho: t.gancho, textoPantalla: t.textoPantalla,
      guardadoEnBaul: false,
    });
  }
}
competidores.sort((a, b) => b.vistas - a.vistas);
write('competitors.json', { semana: iso(END), cuentas, reels: competidores });

// ───────────────────────── Guiones (/guion) ─────────────────────────
write('scripts.json', [
  { id: 'g1', titulo: 'Borrador: cardio en ayunas mata el músculo', hookId: 'h1', template: '[X] acaba de matar a [Y]', angulo: 'polémico / mito del gym', x: 'El cardio en ayunas', y: 'tu masa muscular', cuerpo: '', estado: 'borrador', creado: iso(END) },
]);

// ───────────────────────── Calendario ─────────────────────────
write('calendar.json', [
  { id: 'cal1', fecha: '2026-06-26', titulo: 'El cardio en ayunas mata tu masa muscular', hookId: 'h1', angulo: 'polémico', plataformas: ['instagram', 'tiktok'], estado: 'planeado', origen: '/guion' },
  { id: 'cal2', fecha: '2026-06-28', titulo: '7 cosas que ojalá hubiera sabido antes de hacer fuerza', hookId: 'h3', angulo: 'listicle', plataformas: ['instagram', 'youtube'], estado: 'planeado', origen: '/guion' },
]);

// ───────────────────────── Community manager ─────────────────────────
write('posts.json', [
  { id: 'p1', titulo: 'Deja de contar calorías a ojo', plataformas: ['instagram', 'tiktok', 'x'], descripcion: '', estado: 'borrador', programado: '2026-06-27', creado: iso(END) },
]);

// ───────────────────────── Tendencias (12 fuentes) ─────────────────────────
// Mezcla de ciencia del entrenamiento + nutrición + herramientas de IA para
// contenido, filtrado por lo que sirve para los 4 nichos.
const fuentes = ['Stronger by Science', 'MASS Research Review', 'Examine.com', 'Precision Nutrition', 'NSCA', 'Jeff Nippard (YT)', 'Layne Norton', 'Renaissance Periodization', 'PubMed · entrenamiento', 'Opus Clip (IA)', 'CapCut IA', 'ElevenLabs (voz IA)'];
const titulares = [
  { t: 'Nuevo metaanálisis: volumen óptimo para hipertrofia', util: true, idea: 'Reel: “cuántas series necesitas DE VERDAD” · ' + N.body },
  { t: 'Estudio: proteína y saciedad en déficit calórico', util: true, idea: 'Gancho: “come esto y dejas de tener hambre” · ' + N.food },
  { t: 'Herramienta IA que corta tus reels largos en clips', util: true, idea: 'Setup: “edito 10 reels de mis entrenos en 10 min”' },
  { t: 'Revisión: frecuencia por grupo muscular a la semana', util: true, idea: 'Explainer: “¿cuántas veces entrenar cada músculo?” · ' + N.power },
  { t: 'Paper denso de biomecánica de sentadilla', util: false, idea: '' },
  { t: 'Voz IA para narrar reels sin grabar tu voz', util: true, idea: 'Demo: narra tu reel de hábitos sin grabar · ' + N.health },
];
const trends = [];
let tid = 1;
for (let i = 0; i < fuentes.length; i++) {
  const it = titulares[i % titulares.length];
  trends.push({
    id: 't' + tid++, fuente: fuentes[i], titulo: it.t,
    util: it.util, ideaContenido: it.idea,
    fecha: iso(END.getTime() - Math.floor(r() * 5) * dayMs),
    url: 'https://example.com/' + tid,
  });
}
write('trends.json', { actualizado: iso(END), items: trends });

console.log('Listo.' + (FORCE ? ' (forzado)' : ''));
