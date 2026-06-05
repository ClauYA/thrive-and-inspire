-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — database schema (Supabase / Postgres)
-- Run this once in the Supabase SQL editor (SQL → New query → paste → Run).
-- ─────────────────────────────────────────────────────────────

-- Blog posts ----------------------------------------------------
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  excerpt     text default '',
  cover_image text default '',
  content     text not null default '',          -- Markdown
  author      text default 'Claudia Bittner',
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists posts_published_idx on posts (published, created_at desc);

-- Coaching applications (homepage "Apply" form) -----------------
create table if not exists applications (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text default '',
  email      text not null,
  goal       text default '',
  obstacles  text default '',
  find_us    text default '',
  created_at timestamptz not null default now()
);

-- Full intake submissions (/ready page) -------------------------
create table if not exists intakes (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text default '',
  email          text not null,
  phone          text default '',
  goals          text[] default '{}',
  format         text default '',
  location       text default '',
  weight         text default '',
  height         text default '',
  coached_before text default '',
  experience     text default '',
  message        text default '',
  created_at     timestamptz not null default now()
);

-- Free-guide email leads (popup) --------------------------------
create table if not exists guide_leads (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  email      text not null,
  created_at timestamptz not null default now()
);
