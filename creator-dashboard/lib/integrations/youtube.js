// YouTube Data API v3 — OAuth2 (authorization code) + subida real de video.
// Requiere en .env:  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   y el redirect URI:  GOOGLE_REDIRECT_URI (por defecto http://localhost:4300/api/oauth/youtube/callback)
// El refresh_token se guarda en data/tokens.json (gitignored) tras conectar.
import { getToken, saveTokens } from './tokens.js';

const SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
const redirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 4300}/api/oauth/youtube/callback`;

export function youtubeConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function youtubeConnected() {
  const t = await getToken('youtube');
  return !!(t && t.refresh_token);
}

// URL a la que mandamos al usuario para autorizar la subida a su canal.
export function youtubeAuthUrl() {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',   // para recibir refresh_token
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

// Intercambia el ?code= del callback por tokens y guarda el refresh_token.
export async function youtubeExchangeCode(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  const data = await res.json();
  await saveTokens('youtube', {
    refresh_token: data.refresh_token,
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3500) * 1000,
  });
  return data;
}

// Devuelve un access_token válido, refrescándolo si hace falta.
async function freshAccessToken() {
  const t = await getToken('youtube');
  if (!t?.refresh_token) throw new Error('YouTube no conectado (falta refresh_token)');
  if (t.access_token && t.expires_at && Date.now() < t.expires_at - 60000) return t.access_token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: t.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google refresh ${res.status}: ${await res.text()}`);
  const data = await res.json();
  await saveTokens('youtube', { access_token: data.access_token, expires_at: Date.now() + (data.expires_in || 3500) * 1000 });
  return data.access_token;
}

// Sube un video al canal del usuario. `video` = { buffer, mime }.
// Usa el flujo resumable: 1) crea la sesión con metadata, 2) sube los bytes.
export async function youtubeUpload({ buffer, mime = 'video/*', title, description, privacy = 'private' }) {
  const accessToken = await freshAccessToken();
  const meta = {
    snippet: { title: (title || 'Video').slice(0, 100), description: description || '', categoryId: '17' }, // 17 = Sports
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
  };
  // 1) iniciar sesión resumable
  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mime,
      'X-Upload-Content-Length': String(buffer.length),
    },
    body: JSON.stringify(meta),
  });
  if (!init.ok) throw new Error(`YouTube init ${init.status}: ${await init.text()}`);
  const uploadUrl = init.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube no devolvió la URL de subida');

  // 2) subir los bytes
  const up = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': mime }, body: buffer });
  if (!up.ok) throw new Error(`YouTube upload ${up.status}: ${await up.text()}`);
  const video = await up.json();
  return { id: video.id, url: `https://youtu.be/${video.id}`, raw: video };
}
