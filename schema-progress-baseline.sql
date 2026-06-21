-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Progress baseline (imported snapshot, e.g. Hipertrofit)
-- Run this once in the Supabase SQL editor (after schema-workouts.sql).
--
-- Holds a per-exercise snapshot of progress imported from another platform so
-- the "Progress" views can show a starting point before the member has logged
-- sessions here. evolution_pct is a fraction (0.25 = +25%); volumes are totals.
-- ─────────────────────────────────────────────────────────────
create table if not exists progress_baseline (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  exercise_name text not null,
  muscle_group  text default '',
  evolution_pct numeric default 0,
  vol_max       numeric default 0,
  vol_current   numeric default 0,
  source        text default 'hipertrofit',
  created_at    timestamptz not null default now()
);
create index if not exists progress_baseline_user_idx on progress_baseline (user_id);
