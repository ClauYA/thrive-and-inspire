-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Routines (A/B/C rotation) schema (Phase 2b)
-- Run this once in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────

-- One routine per user, with a rotating pointer (next_index).
create table if not exists routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references users(id) on delete cascade,
  name       text default 'My Routine',
  next_index int not null default 0,
  created_at timestamptz not null default now()
);

-- The ordered days of the rotation (Day A, Day B, Day C, …).
create table if not exists routine_days (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references routines(id) on delete cascade,
  position     int not null,
  name         text not null,
  exercise_ids uuid[] default '{}'
);
create index if not exists routine_days_routine_idx on routine_days (routine_id, position);
