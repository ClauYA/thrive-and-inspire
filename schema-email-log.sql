-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Email log
-- Run this once in the Supabase SQL editor (after schema.sql).
--
-- Records every email the server sends (notifications, auto-replies, password
-- resets) so they can be audited from the admin dashboard.
-- ─────────────────────────────────────────────────────────────
create table if not exists email_log (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,                  -- application, application_autoreply, intake, guide_lead, testimonial, password_reset
  recipient  text not null default '',
  subject    text default '',
  body       text default '',                -- plain-text version of the message
  status     text not null default 'sent',   -- sent | failed | skipped
  error      text,                           -- error message when status = failed
  created_at timestamptz not null default now()
);
create index if not exists email_log_created_idx on email_log (created_at desc);
