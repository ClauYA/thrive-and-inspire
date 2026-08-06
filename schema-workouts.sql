-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Workout tracker schema (Phase 1)
-- Run this once in the Supabase SQL editor (in addition to schema.sql).
-- ─────────────────────────────────────────────────────────────

-- Member accounts (separate from the blog admin) -----------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- Exercise library (coach fills in media_url with a gif/video) ----
create table if not exists exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  muscle_group text default '',
  equipment    text default '',
  media_url    text default '',     -- gif or video URL (Phase 2)
  instructions text default '',
  created_at   timestamptz not null default now()
);

-- A workout session ----------------------------------------------
create table if not exists workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  title        text default 'Workout',
  performed_at timestamptz not null default now(),
  notes        text default '',
  created_at   timestamptz not null default now()
);
create index if not exists workouts_user_idx on workouts (user_id, performed_at desc);

-- Individual sets within a workout -------------------------------
create table if not exists workout_sets (
  id            uuid primary key default gen_random_uuid(),
  workout_id    uuid not null references workouts(id) on delete cascade,
  exercise_id   uuid references exercises(id),
  exercise_name text not null,     -- denormalized so history stays stable
  set_number    int not null default 1,
  weight        numeric default 0,
  reps          int default 0,
  rir           numeric,           -- reps in reserve
  rpe           numeric,           -- rate of perceived exertion
  created_at    timestamptz not null default now()
);
create index if not exists sets_workout_idx on workout_sets (workout_id);

-- Starter exercise list (only inserted if the library is empty) --
insert into exercises (name, muscle_group, equipment)
select v.name, v.muscle_group, v.equipment from (values
  ('Back Squat', 'Legs', 'Barbell'),
  ('Front Squat', 'Legs', 'Barbell'),
  ('Leg Press', 'Legs', 'Machine'),
  ('Romanian Deadlift', 'Hamstrings', 'Barbell'),
  ('Leg Curl', 'Hamstrings', 'Machine'),
  ('Leg Extension', 'Quads', 'Machine'),
  ('Walking Lunge', 'Legs', 'Dumbbell'),
  ('Hip Thrust', 'Glutes', 'Barbell'),
  ('Deadlift', 'Back', 'Barbell'),
  ('Bench Press', 'Chest', 'Barbell'),
  ('Incline Dumbbell Press', 'Chest', 'Dumbbell'),
  ('Chest Fly', 'Chest', 'Machine'),
  ('Overhead Press', 'Shoulders', 'Barbell'),
  ('Lateral Raise', 'Shoulders', 'Dumbbell'),
  ('Pull-Up', 'Back', 'Bodyweight'),
  ('Lat Pulldown', 'Back', 'Machine'),
  ('Seated Row', 'Back', 'Machine'),
  ('Barbell Row', 'Back', 'Barbell'),
  ('Bicep Curl', 'Biceps', 'Dumbbell'),
  ('Tricep Pushdown', 'Triceps', 'Cable'),
  ('Plank', 'Core', 'Bodyweight'),
  ('Cable Crunch', 'Core', 'Cable')
) as v(name, muscle_group, equipment)
where not exists (select 1 from exercises);
