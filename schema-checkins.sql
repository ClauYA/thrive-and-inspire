-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Weekly check-ins
-- Run once in the Supabase SQL editor (after schema-workouts.sql).
--
-- One row per member per week: body weight + measurements (cm), a progress
-- photo (client-resized JPEG data URL), the week's challenges, and 1–5 ratings
-- for nutrition, training, stress and sleep. Unique per (user, week_start) so
-- re-saving the same week updates it.
-- ─────────────────────────────────────────────────────────────
create table if not exists checkins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  week_start       date not null,
  weight           numeric,
  neck             numeric,
  waist            numeric,
  abdomen          numeric,
  hips             numeric,
  arm_left         numeric,
  arm_right        numeric,
  leg_left         numeric,
  leg_right        numeric,
  photo            text default '',
  challenges       text default '',
  nutrition_rating int,
  training_rating  int,
  stress_level     int,
  sleep_level      int,
  created_at       timestamptz not null default now(),
  unique (user_id, week_start)
);
create index if not exists checkins_user_idx on checkins (user_id, week_start desc);
