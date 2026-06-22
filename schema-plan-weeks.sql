-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Plans become 4 levels: Mesocycle → Week → Day → Exercise
-- Run this once in the Supabase SQL editor (after schema-plans.sql).
--
-- A plan (mesocycle) now has weeks; each week has days; each day has exercises
-- with prescribed targets (sets / reps / RIR). Existing single-level plan_days
-- stay valid (week_id is just null for them).
-- ─────────────────────────────────────────────────────────────

-- Weeks within a mesocycle
create table if not exists plan_weeks (
  id        uuid primary key default gen_random_uuid(),
  plan_id   uuid not null references plans(id) on delete cascade,
  position  int not null,
  name      text not null,
  notes     text default ''
);
create index if not exists plan_weeks_plan_idx on plan_weeks (plan_id, position);

-- Days now belong to a week
alter table plan_days add column if not exists week_id uuid references plan_weeks(id) on delete cascade;

-- Prescribed exercises inside a day (with targets)
create table if not exists plan_exercises (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references plan_days(id) on delete cascade,
  position    int not null,
  exercise_id uuid references exercises(id) on delete set null,
  sets        int,
  reps        text default '',     -- target rep range, e.g. "8-10"
  rir         text default '',     -- target RIR, e.g. "1-2"
  notes       text default ''
);
create index if not exists plan_exercises_day_idx on plan_exercises (day_id, position);

-- Pointer to the current week of the active mesocycle (for "up next")
alter table plans add column if not exists current_week int not null default 0;
