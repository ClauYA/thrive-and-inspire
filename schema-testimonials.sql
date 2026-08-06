-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Client testimonials
-- Run this once in the Supabase SQL editor (after schema.sql).
--
-- Clients submit feedback via the public /feedback form (published = false).
-- The coach reviews them in the admin dashboard and flips `published` (and
-- optionally `featured`) to share them in the Testimonials section.
-- ─────────────────────────────────────────────────────────────
create table if not exists testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  detail     text default '',                 -- shown under the name (role, weeks, result)
  email      text default '',                 -- optional, for follow-up — never shown publicly
  rating     int  not null default 5,         -- 1–5 stars
  text       text not null,                   -- the comment
  image      text default '',                 -- optional avatar URL (coach can add)
  lang       text default 'es',               -- 'es' or 'en'
  published  boolean not null default false,  -- approved + shared publicly
  featured   boolean not null default false,  -- highlighted in the carousel
  created_at timestamptz not null default now()
);
create index if not exists testimonials_published_idx on testimonials (published, created_at desc);
