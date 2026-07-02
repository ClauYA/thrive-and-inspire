-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Check-in weight unit (kg/lb)
-- Run ONLY if you already created the `checkins` table before this column
-- existed. (Fresh installs get it from schema-checkins.sql.)
--
-- The stored `weight` is always kg; `weight_unit` records what the member typed
-- (kg or lb) so it can be shown back in that unit.
-- ─────────────────────────────────────────────────────────────
alter table checkins add column if not exists weight_unit text default 'kg';
