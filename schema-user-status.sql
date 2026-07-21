-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Member account gating
-- Adds a status to users so signup is no longer open:
--   approved | pending | rejected  (only "approved" can log in)
--
-- The server's ensureSchema() applies this automatically on startup, so
-- running this by hand is optional. Default is 'approved' so EXISTING
-- members are NOT locked out; only new self-signups are inserted as 'pending'.
-- ─────────────────────────────────────────────────────────────
alter table users add column if not exists status text not null default 'approved';
