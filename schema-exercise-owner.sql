-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — User-owned exercises (editable catalog)
-- Run this once in the Supabase SQL editor (after schema-workouts.sql).
--
-- Exercises with owner_id = NULL are the shared/default library (visible to
-- everyone). Exercises a member adds from the app get their user id, so each
-- person can grow their own catalog without touching the defaults.
-- ─────────────────────────────────────────────────────────────
alter table exercises add column if not exists owner_id uuid references users(id) on delete cascade;
create index if not exists exercises_owner_idx on exercises (owner_id);
