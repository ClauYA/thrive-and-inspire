// Instagram Content Publishing API (Meta Graph API).
// Requiere en .env:
//   IG_USER_ID         → id de la cuenta de Instagram Business/Creator
//   IG_ACCESS_TOKEN    → token de larga duración con permisos
//                        instagram_content_publish + instagram_basic
// La API NO sube archivos: publica a partir de una URL pública de imagen/video.
//   - Imagen → image_url
//   - Reel   → media_type=REELS + video_url (hay que esperar a que procese)
const GRAPH = 'https://graph.facebook.com/v21.0';

export function instagramConfigured() {
  return !!(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
}

const igUser = () => process.env.IG_USER_ID;
const token = () => process.env.IG_ACCESS_TOKEN;

async function graph(path, params, method = 'POST') {
  const url = `${GRAPH}/${path}`;
  const body = new URLSearchParams({ ...params, access_token: token() });
  const res = await fetch(method === 'GET' ? `${url}?${body}` : url, {
    method,
    headers: method === 'GET' ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Instagram ${res.status}: ${data.error?.message || JSON.stringify(data)}`);
  return data;
}

// Publica una imagen o un reel. `media` = { mediaUrl, tipo: 'image'|'reels' }
export async function instagramPublish({ mediaUrl, caption = '', tipo = 'image' }) {
  if (!mediaUrl) throw new Error('Instagram necesita una URL pública de imagen o video (mediaUrl)');

  // 1) crear el contenedor de media
  const params = tipo === 'reels'
    ? { media_type: 'REELS', video_url: mediaUrl, caption }
    : { image_url: mediaUrl, caption };
  const container = await graph(`${igUser()}/media`, params);
  const creationId = container.id;

  // 2) los videos/reels tardan en procesar: esperar a FINISHED
  if (tipo === 'reels') {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const st = await graph(creationId, { fields: 'status_code' }, 'GET');
      if (st.status_code === 'FINISHED') break;
      if (st.status_code === 'ERROR') throw new Error('Instagram: el video falló al procesar');
    }
  }

  // 3) publicar el contenedor
  const published = await graph(`${igUser()}/media_publish`, { creation_id: creationId });
  return { id: published.id, url: `https://www.instagram.com/p/${published.id}/`, raw: published };
}
