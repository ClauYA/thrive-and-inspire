-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Per-member daily nutrition goals (set by the coach)
-- Run once in the Supabase SQL editor (after schema-nutrition.sql).
--
-- One row per member with their daily targets. The coach sets them from the
-- admin panel; the member sees them against their daily totals.
-- ─────────────────────────────────────────────────────────────
create table if not exists nutrition_goals (
  user_id    uuid primary key references users(id) on delete cascade,
  calories   numeric not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  updated_at timestamptz not null default now()
);
