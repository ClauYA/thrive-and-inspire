# Tablero de Contenido — Creator Dashboard

App independiente para gestionar el contenido de un negocio de creador. Vive en
`creator-dashboard/` y **no toca** el sitio de coaching del repo principal.

**Nichos del creador** (todo el contenido semilla y el detector de nicho giran en
torno a estos 4): `healthy lifestyle` · `powerbuilding` · `bodybuilding` ·
`conscious eating`. Se definen en `lib/templater.js` (`NICHES` + `guessNiche`) y se
usan en los datasets de `data/`. Para cambiarlos, editar esos dos puntos y
re-correr `node scripts/seed.mjs --force`.

## Cómo correrlo

```bash
cd creator-dashboard
npm install
npm start          # http://localhost:4300
npm run dev        # igual, con --watch (recarga el server al guardar)
```

No hay paso de build: el frontend es estático y Tailwind se carga por CDN.

---

## Herramientas y decisiones

| Decisión | Qué elegí | Por qué |
|---|---|---|
| **Backend** | Node.js + Express (ESM) | Pedido explícito de Node. Express es mínimo y suficiente para una API REST + servir estáticos. Cero dependencias de build. |
| **Frontend** | HTML estático + JavaScript modular (ES Modules) | Sin framework ni bundler: el tablero es una SPA con router por hash. Arranca al instante, fácil de leer y de extender. |
| **Estilos** | Tailwind CSS vía **Play CDN** (`cdn.tailwindcss.com`) | Pedido explícito de Tailwind. El CDN evita un paso de build. Para producción real conviene migrar a `@tailwindcss/cli`; lo dejé anotado abajo. |
| **Tema** | **Modo oscuro** por defecto (`class="dark"` en `<html>`) | Pedido. Hay toggle claro/oscuro en la barra lateral. |
| **Color** | **Verde hierba** como acento (`grass` 50–900, base `#65a30d`/`#84cc16`) | Pedido. Definido en el `tailwind.config` inline de `index.html`. |
| **Layout** | **Barra lateral** fija con las 7 secciones + colapsable en móvil | Pedido. |
| **Datos** | Archivos JSON en `data/`, leídos/escritos por la API | Sin base de datos: persiste en disco, es inspeccionable y versionable. Si se quiere escalar, se cambia la capa `store.js` por Postgres (el repo padre ya usa `pg`). |
| **Gráficos** | Sparklines en **SVG inline** hechos a mano | Evita sumar Chart.js. Minigráficos de 7/30/90 días sin dependencias. |

### Estructura

```
creator-dashboard/
  server.js            API REST + sirve /public
  store.js             capa de lectura/escritura de los JSON de data/
  lib/templater.js     convierte una transcripción en plantilla con [X]/[Y]/[número]
  scripts/seed.mjs     genera los JSON de data/ (determinista; no pisa hooks.json)
  data/*.json          datos semilla (ganchos, métricas, competencia, etc.)
  .claude/launch.json  config del preview local (puerto 4300)
  public/
    index.html         shell + Tailwind config (tema verde hierba, dark)
    js/app.js          router por hash + layout (barra lateral)
    js/api.js          fetch helpers
    js/ui.js           helpers de UI (sparkline, tarjetas, formato)
    js/sections/*.js   una vista por sección
  CLAUDE.md            este archivo
```

### Las 7 secciones

1. **Baúl de ganchos** — cada gancho guardado se transcribe y queda como plantilla
   reutilizable (`[X] acaba de matar a [Y]`, etc.). Búsqueda por nicho, tipo y
   vistas. Muestra quién lo hizo primero, las vistas, y un botón **Usar este** que
   abre el panel `/guion` a la derecha.
2. **Métricas** — vistas de Instagram, guardados, seguidores nuevos y volumen de
   DMs, con minigráfico por métrica a 7/30/90 días. Alerta cuando un reel duplica
   la mediana de los últimos 30 días. Top 5 reels por vistas con una línea que
   explica por qué explotó cada uno.
3. **Rastreador de competencia** — cada domingo levanta los 5 reels más vistos de
   las 8 cuentas seguidas, transcribe el audio, saca gancho + texto en pantalla,
   ordena por vistas, muestra @ y seguidores, y permite guardar directo al baúl.
4. **Community manager** — publicación multi-plataforma en un clic y descripciones
   que se autoescriben.
5. **Calendario de contenido** — se llena solo desde `/guion` con ganchos y ángulos.
6. **Tendencias** — novedades de IA de 12 fuentes, filtradas por lo que sirve para
   contenido.

### Integraciones reales (stubs marcados con `// TODO:integración`)

Lo que necesita un servicio externo está implementado con datos semilla + un
endpoint de "refresh" simulado, y marcado en el código:

- **Transcripción de audio** (baúl): ✅ **conectada**. `POST /api/hooks/transcribe`
  acepta un archivo de audio (campo `audio`) o un `audioUrl` y lo transcribe con
  **OpenAI Whisper** (`OPENAI_API_KEY`) o **AssemblyAI** (`ASSEMBLYAI_API_KEY`) —
  ver `lib/transcribe.js`. Sin key configurada, cae al modo "pegar texto" y extrae
  la plantilla por heurística. El front consulta `GET /api/transcribe/status` para
  mostrar u ocultar la subida de audio. Copia `.env.example` → `.env` para activar.
- **Métricas de Instagram**: hoy lee `data/metrics.json`. Conectar Instagram Graph
  API en `store.js`.
- **Rastreo de competencia (domingos)**: `POST /api/competitors/refresh` simula la
  corrida semanal. Programar con cron + scraping/API. 
- **Publicación multi-plataforma**: ✅ **Instagram y YouTube conectados de verdad**;
  TikTok y X siguen simulados.
  - **YouTube** (`lib/integrations/youtube.js`): OAuth2 (botón "Conectar" →
    `/api/connect/youtube` → callback guarda el `refresh_token` en
    `data/tokens.json`, gitignored) + subida real vía resumable upload. Requiere
    `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
  - **Instagram** (`lib/integrations/instagram.js`): Graph API, contenedor +
    `media_publish` (imágenes y reels, con polling de estado). Requiere
    `IG_USER_ID` + `IG_ACCESS_TOKEN` y que el media esté en una **URL pública**.
  - `POST /api/posts/:id/publish` llama a la API real donde haya credenciales y
    cae a **simulado** en el resto; devuelve `resultados[]` por plataforma.
  - `GET /api/posts/accounts` informa el estado de conexión de cada plataforma.
- **Tendencias (12 fuentes)**: `POST /api/trends/refresh` relee semilla. Conectar
  los 12 feeds RSS/APIs.

### Si se migra a producción
- Reemplazar Tailwind Play CDN por build (`@tailwindcss/cli` → `public/styles.css`).
- Reemplazar `store.js` (JSON) por Postgres.
- Mover los "refresh" a cron jobs reales y cablear las integraciones de arriba.
