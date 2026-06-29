-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Nutrition meals + saved meal templates
-- Run once in the Supabase SQL editor (after schema-nutrition.sql).
--
-- 1) Each logged food now belongs to a meal (breakfast/lunch/dinner/snack or a
--    custom name) so the day can be split like FatSecret.
-- 2) Saved meals let a member store a combination of foods and re-add it later.
-- ─────────────────────────────────────────────────────────────
alter table nutrition_logs add column if not exists meal text not null default 'breakfast';

create table if not exists saved_meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists saved_meal_items (
  id             uuid primary key default gen_random_uuid(),
  saved_meal_id  uuid not null references saved_meals(id) on delete cascade,
  food_name      text not null,
  serving        text default '',
  quantity       numeric not null default 1,
  calories       numeric not null default 0,
  protein        numeric not null default 0,
  carbs          numeric not null default 0,
  fat            numeric not null default 0,
  fs_food_id     text default ''
);
create index if not exists saved_meal_items_meal on saved_meal_items (saved_meal_id);
