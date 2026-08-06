// Capa de persistencia: lee/escribe los JSON de data/.
// Para escalar, reemplazar este módulo por una capa Postgres (el repo padre usa `pg`).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
const fileOf = (name) => join(dataDir, `${name}.json`);

export async function read(name) {
  const raw = await readFile(fileOf(name), 'utf8');
  return JSON.parse(raw);
}

export async function write(name, value) {
  await writeFile(fileOf(name), JSON.stringify(value, null, 2));
  return value;
}

// id incremental simple basado en prefijo (h, c, g, cal, p, t...).
export function nextId(items, prefix) {
  let max = 0;
  for (const it of items) {
    const m = String(it.id || '').match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${max + 1}`;
}
