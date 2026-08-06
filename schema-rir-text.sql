-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — RIR as text ranges
-- Run this once in the Supabase SQL editor (after schema-workouts.sql).
--
-- RIR is captured as a selector with values: fallo, 0-1, 1, 1-2, 2, 2-3.
-- These are ranges, so the column changes from numeric to text. Existing
-- numeric values are preserved as their text form ("2" → "2").
-- ─────────────────────────────────────────────────────────────
alter table workout_sets alter column rir type text using rir::text;
