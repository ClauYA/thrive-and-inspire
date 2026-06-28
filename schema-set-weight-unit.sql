-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — per-SET weight unit (kg or lb)
-- Run once in the Supabase SQL editor (after schema-workouts.sql and
-- schema-weight-unit.sql).
--
-- Each set can now be logged in kg or lb independently. Existing sets
-- default to 'kg'. The per-workout weight_unit column stays as the default.
-- ─────────────────────────────────────────────────────────────
alter table workout_sets add column if not exists weight_unit text not null default 'kg';
