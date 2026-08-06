# Lift & Inspire

Coaching landing page — **React (Vite + Tailwind v4)** frontend with an **Express** API backend.

This is the v2 rebuild of the original single-file `public/index.html`. Same warm
visual identity (terracotta / forest / sage palette, Cormorant + DM Sans), now a
proper component-based app with a real backend for the application form.

## Structure

```
lift-and-inspire/
├── server.js              # Express API + serves the built client
├── package.json           # backend deps + dev/build/start scripts
├── client/                # React frontend (Vite)
│   ├── index.html
│   ├── vite.config.js     # dev proxy: /api -> :3000
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css      # Tailwind v4 + design tokens (@theme)
│       ├── i18n/          # LanguageContext + EN/ES translations
│       └── components/    # Navbar, Hero, Struggles, Story, HowItWorks,
│                          # Benefits, Testimonials, ApplyForm, Faq,
│                          # FinalCta, Footer, Reveal
└── public/                # original v1 site (kept for reference)
```

## Getting started

Install everything (backend + frontend):

```bash
npm run install:all
```

### Develop (hot reload)

Runs the Express API on `:3000` and the Vite dev server on `:5173` together.
Open **http://localhost:5173** — API calls are proxied to the backend automatically.

```bash
npm run dev
```

### Production build + run

Builds the React app into `client/dist`, then Express serves it on `:3000`.

```bash
npm run build
npm start
# -> http://localhost:3000
```

## The application form

`POST /api/apply` validates the submission (name + valid email required) and:

- **Always** appends it to `submissions.jsonl` (gitignored — contains personal data).
- **Emails** it to the coach **if** email is configured (otherwise email is skipped).

This replaces the old client-side EmailJS approach, so no API keys live in the browser.

### Email config

Copy `.env.example` to `.env` and fill it in. The server loads it automatically
(via `dotenv`). `.env` is gitignored — never commit it.

#### Option 1 — Gmail (recommended, simplest)

1. Enable **2-Step Verification** on the Google account.
2. Create an **App Password**: https://myaccount.google.com/apppasswords
3. Put it in `.env`:

```env
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop   # the 16-char app password (spaces ok)
APPLY_TO=youraddress@gmail.com           # optional, defaults to GMAIL_USER
```

> ⚠️ Use an **App Password**, not your normal Gmail password — the regular
> password won't work once 2-Step Verification is on.

#### Option 2 — Generic SMTP

Leave the `GMAIL_*` vars blank and set these instead:

| Variable     | Description                              |
| ------------ | ---------------------------------------- |
| `SMTP_HOST`  | SMTP server host                         |
| `SMTP_PORT`  | Port (587 default, 465 = secure)         |
| `SMTP_USER`  | SMTP username                            |
| `SMTP_PASS`  | SMTP password                            |
| `APPLY_TO`   | Where applications are sent (defaults to `SMTP_USER`) |
| `PORT`       | Server port (defaults to 3000)           |

Either way, when email isn't configured the app still works — submissions just
go to `submissions.jsonl` instead.

## Languages

English / Spanish toggle in the navbar. All copy lives in
`client/src/i18n/translations.js`; components read it via the `useLanguage()` hook.
```
