-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Nutrition log (FatSecret integration)
-- Run once in the Supabase SQL editor (after schema-workouts.sql).
--
-- Each row is one food the member logged for a given day. Calories and macros
-- are stored as the already-multiplied totals for the chosen quantity, so the
-- daily summary is a simple SUM. Food search itself uses the FatSecret API and
-- is not stored here.
-- ─────────────────────────────────────────────────────────────
create table if not exists nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  logged_on   date not null default current_date,
  food_name   text not null,
  serving     text default '',
  quantity    numeric not null default 1,
  calories    numeric not null default 0,
  protein     numeric not null default 0,
  carbs       numeric not null default 0,
  fat         numeric not null default 0,
  source      text default 'fatsecret',
  fs_food_id  text default '',
  created_at  timestamptz not null default now()
);
create index if not exists nutrition_logs_user_day on nutrition_logs (user_id, logged_on);
