// Convierte una transcripción / texto de gancho en una PLANTILLA reutilizable.
// Heurística local (sin IA): detecta los patrones conocidos y abstrae las variables.
// TODO:integración — para transcribir audio real conectar Whisper/AssemblyAI antes
// de pasar el texto por aquí (ver POST /api/hooks/transcribe en server.js).

const PATTERNS = [
  {
    // "X acaba de matar a Y"
    tipo: 'polemico',
    re: /^(.+?)\s+acaba de matar a\s+(.+)$/i,
    template: '[X] acaba de matar a [Y]',
    vars: (m) => ({ X: m[1].trim(), Y: m[2].trim() }),
  },
  {
    // "N cosas que ojalá hubiera sabido [...]"
    tipo: 'listicle',
    re: /^(\d+)\s+cosas que ojal[áa] hubiera sabido(.*)$/i,
    template: '[número] cosas que ojalá hubiera sabido',
    vars: (m) => ({ número: m[1].trim() }),
  },
  {
    // "Deja de hacer X" / "Deja de <verbo> ..."
    tipo: 'consejo',
    re: /^deja de\s+(.+)$/i,
    template: 'Deja de hacer [X]',
    vars: (m) => ({ X: m[1].trim() }),
  },
  {
    // "Probé X durante <tiempo> y esto pasó"
    tipo: 'review',
    re: /^prob[ée]\s+(.+?)\s+durante\s+(.+?)\s+y\s+esto.*$/i,
    template: 'Probé [X] durante [tiempo] y esto pasó',
    vars: (m) => ({ X: m[1].trim(), tiempo: m[2].trim() }),
  },
];

export function toTemplate(text) {
  const clean = String(text || '').trim().replace(/\s+/g, ' ');
  for (const p of PATTERNS) {
    const m = clean.match(p.re);
    if (m) return { template: p.template, tipo: p.tipo, variables: p.vars(m), matched: true };
  }
  // Sin patrón conocido: dejamos el texto tal cual como plantilla libre.
  return { template: clean, tipo: 'otro', variables: {}, matched: false };
}

// Nichos del creador.
export const NICHES = ['healthy lifestyle', 'powerbuilding', 'bodybuilding', 'conscious eating'];

// Adivina el nicho por palabras clave (fallback editable por el usuario).
// El orden importa: lo más específico primero.
export function guessNiche(text) {
  const t = String(text || '').toLowerCase();
  // powerbuilding: fuerza / levantamientos / lógica de progresión
  if (/\b(fuerza|powerbuild|sentadilla|peso muerto|press de banca|banca|1rm|rm|rir|al fallo|fallo|series|repeticiones|progresi[óo]n|barra|fuerza m[áa]xima)\b/.test(t)) return 'powerbuilding';
  // bodybuilding: hipertrofia / físico / proteína-músculo
  if (/\b(hipertrofia|masa muscular|m[úu]sculo|volumen|definici[óo]n|prote[íi]na|f[íi]sico|ganancia muscular|posing|bulking|cutting|cardio en ayunas)\b/.test(t)) return 'bodybuilding';
  // conscious eating: alimentación / calorías / hábitos de comida
  if (/\b(calor[íi]as|d[ée]ficit|super[áa]vit|ultraprocesad|ayuno|hambre|saciedad|alimentaci[óo]n|comer|antojo|macros|az[úu]car|comida real)\b/.test(t)) return 'conscious eating';
  // healthy lifestyle: hábitos / sueño / energía / bienestar
  if (/\b(h[áa]bito|pasos|caminar|dormir|sue[ñn]o|energ[íi]a|estr[ée]s|bienestar|rutina|hidrataci[óo]n|descanso|movilidad)\b/.test(t)) return 'healthy lifestyle';
  return 'healthy lifestyle';
}
