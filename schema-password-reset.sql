-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Password reset tokens
-- Run this once in the Supabase SQL editor (after schema-workouts.sql).
--
-- We never store the raw reset token — only its SHA-256 hash — so a leak of
-- this table can't be used to reset anyone's password. Tokens are single-use
-- and expire after a short window.
-- ─────────────────────────────────────────────────────────────
create table if not exists password_resets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_token_idx on password_resets (token_hash);
create index if not exists password_resets_user_idx on password_resets (user_id);
