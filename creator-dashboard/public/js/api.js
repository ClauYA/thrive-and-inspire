// Helpers de fetch para la API REST.
async function req(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  // ganchos
  hooks: (qs = '') => req('GET', `/api/hooks${qs}`),
  transcribe: (text) => req('POST', '/api/hooks/transcribe', { text }),
  transcribeStatus: () => req('GET', '/api/transcribe/status'),
  transcribeAudio: async (file) => {
    const fd = new FormData();
    fd.append('audio', file);
    const res = await fetch('/api/hooks/transcribe', { method: 'POST', body: fd });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
    return res.json();
  },
  addHook: (h) => req('POST', '/api/hooks', h),
  delHook: (id) => req('DELETE', `/api/hooks/${id}`),
  // métricas
  metrics: () => req('GET', '/api/metrics'),
  // competencia
  competitors: () => req('GET', '/api/competitors'),
  refreshCompetitors: () => req('POST', '/api/competitors/refresh'),
  competitorToVault: (id) => req('POST', `/api/competitors/${id}/to-vault`),
  // guiones
  scripts: () => req('GET', '/api/scripts'),
  addScript: (s) => req('POST', '/api/scripts', s),
  updateScript: (id, s) => req('PUT', `/api/scripts/${id}`, s),
  delScript: (id) => req('DELETE', `/api/scripts/${id}`),
  // calendario
  calendar: () => req('GET', '/api/calendar'),
  calendarFromScript: (id, b) => req('POST', `/api/calendar/from-script/${id}`, b || {}),
  delCalendar: (id) => req('DELETE', `/api/calendar/${id}`),
  // community manager
  posts: () => req('GET', '/api/posts'),
  postAccounts: () => req('GET', '/api/posts/accounts'),
  autodescribe: (titulo, plataformas, gancho, nicho) => req('POST', '/api/posts/autodescribe', { titulo, plataformas, gancho, nicho }),
  addPost: (p) => req('POST', '/api/posts', p),
  publishPost: (id) => req('POST', `/api/posts/${id}/publish`),
  delPost: (id) => req('DELETE', `/api/posts/${id}`),
  // tendencias
  trends: (soloUtil) => req('GET', `/api/trends${soloUtil ? '?soloUtil=1' : ''}`),
  refreshTrends: () => req('POST', '/api/trends/refresh'),
};
