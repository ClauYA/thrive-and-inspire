-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Plans / Mesocycles
-- Run this once in the Supabase SQL editor (after schema-workouts.sql).
--
-- A plan (mesocycle) has a name, objective, length in weeks, optional start/end
-- dates, and an ordered list of days. One plan can be the "active" one, whose
-- days drive the dashboard "up next" rotation. Each logged workout can point
-- back to the plan it belonged to.
-- ─────────────────────────────────────────────────────────────
create table if not exists plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null default 'My Plan',
  objective  text default '',
  weeks      int default 8,
  start_date date,
  end_date   date,
  is_active  boolean not null default false,
  next_index int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists plans_user_idx on plans (user_id, created_at desc);

create table if not exists plan_days (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references plans(id) on delete cascade,
  position     int not null,
  name         text not null,
  exercise_ids uuid[] default '{}',
  notes        text default ''          -- tempo, intensity, cues for that day
);
create index if not exists plan_days_plan_idx on plan_days (plan_id, position);

-- Link each logged workout to the plan it belonged to (optional).
alter table workouts add column if not exists plan_id uuid references plans(id) on delete set null;
