-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — per-workout weight unit (kg or lb)
-- Run once in Supabase.
-- ─────────────────────────────────────────────────────────────
alter table workouts add column if not exists weight_unit text not null default 'kg';
