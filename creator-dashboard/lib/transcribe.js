// Transcripción de audio real. Elige proveedor según la API key disponible:
//   - OPENAI_API_KEY      → OpenAI Whisper  (1 request)
//   - ASSEMBLYAI_API_KEY  → AssemblyAI      (upload → crear → poll)
// Si no hay ninguna key configurada, lanza un error claro para que el front
// caiga al modo "pegar texto" (heurística local del templater).
//
// Node 18+ trae fetch / FormData / Blob globales — sin dependencias extra.

export function transcriptionProvider() {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ASSEMBLYAI_API_KEY) return 'assemblyai';
  return null;
}

// audio: { buffer: Buffer, filename: string, mime: string }
// lang:  código ISO opcional ('es' por defecto)
export async function transcribeAudio(audio, lang = 'es') {
  const provider = transcriptionProvider();
  if (!provider) {
    const err = new Error('No hay proveedor de transcripción configurado. Define OPENAI_API_KEY o ASSEMBLYAI_API_KEY en creator-dashboard/.env');
    err.code = 'NO_PROVIDER';
    throw err;
  }
  if (provider === 'openai') return whisper(audio, lang);
  return assemblyai(audio, lang);
}

// ───────────────────────── OpenAI Whisper ─────────────────────────
async function whisper(audio, lang) {
  const form = new FormData();
  form.append('file', new Blob([audio.buffer], { type: audio.mime || 'audio/mpeg' }), audio.filename || 'audio.mp3');
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1');
  if (lang) form.append('language', lang);
  form.append('response_format', 'json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: (data.text || '').trim(), provider: 'openai' };
}

// ───────────────────────── AssemblyAI ─────────────────────────
async function assemblyai(audio, lang) {
  const key = process.env.ASSEMBLYAI_API_KEY;
  // 1) subir bytes
  const up = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: { authorization: key, 'content-type': 'application/octet-stream' },
    body: audio.buffer,
  });
  if (!up.ok) throw new Error(`AssemblyAI upload ${up.status}: ${await up.text()}`);
  const { upload_url } = await up.json();

  // 2) crear transcripción
  const create = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { authorization: key, 'content-type': 'application/json' },
    body: JSON.stringify({ audio_url: upload_url, language_code: lang || 'es' }),
  });
  if (!create.ok) throw new Error(`AssemblyAI create ${create.status}: ${await create.text()}`);
  const { id } = await create.json();

  // 3) poll hasta completar (timeout ~2 min)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, { headers: { authorization: key } });
    const data = await poll.json();
    if (data.status === 'completed') return { text: (data.text || '').trim(), provider: 'assemblyai' };
    if (data.status === 'error') throw new Error(`AssemblyAI: ${data.error}`);
  }
  throw new Error('AssemblyAI: timeout esperando la transcripción');
}
