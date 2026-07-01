-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Session feedback on a logged workout
-- Run once in the Supabase SQL editor (after schema-workouts.sql).
--
-- Captures how the session felt when saving the day's workout:
--   session_feel     1–10 overall intensity of the routine
--   session_effort   easy | moderate | hard | limit
--   muscle_intensity { "Chest": 4, "Back": 3, ... }  (group → 1–5)
-- ─────────────────────────────────────────────────────────────
alter table workouts add column if not exists session_feel int;
alter table workouts add column if not exists session_effort text default '';
alter table workouts add column if not exists muscle_intensity jsonb default '{}'::jsonb;
