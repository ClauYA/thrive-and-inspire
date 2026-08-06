// Almacén de tokens OAuth (YouTube). Vive en data/tokens.json, que está
// gitignored — son secretos, NO se commitean.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', '..', 'data', 'tokens.json');

export async function readTokens() {
  if (!existsSync(FILE)) return {};
  try { return JSON.parse(await readFile(FILE, 'utf8')); } catch { return {}; }
}

export async function saveTokens(platform, data) {
  const all = await readTokens();
  all[platform] = { ...all[platform], ...data };
  await writeFile(FILE, JSON.stringify(all, null, 2));
  return all[platform];
}

export async function getToken(platform) {
  return (await readTokens())[platform] || null;
}
