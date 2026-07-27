-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Manual GIF override per exercise
-- Lets the coach pin an exercise to a specific ExerciseDB animation (by id)
-- when the automatic name match is wrong. Applied automatically by the
-- server's ensureSchema() on startup; this file is just for reference.
-- ─────────────────────────────────────────────────────────────
alter table exercises add column if not exists gif_id text;
