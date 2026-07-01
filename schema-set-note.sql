-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Per-exercise note on a logged workout
-- Run once in the Supabase SQL editor (after schema-workouts.sql).
--
-- The member can add a final note about each exercise while logging. It's
-- stored on the exercise's first set row (workout_sets.note).
-- ─────────────────────────────────────────────────────────────
alter table workout_sets add column if not exists note text default '';
