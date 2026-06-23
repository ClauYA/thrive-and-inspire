-- ─────────────────────────────────────────────────────────────
-- One-shot fix for WELLNESS "Up next" jumping ahead.
--
-- Cause: the Excel import created the *program* sessions you haven't actually
-- trained yet (Girls · Día 2, Día 3 …) with real-looking future dates, so the
-- app counts them as done and the pointer skips to Día 3.
--
-- This script:
--   1) deletes ONLY imported placeholder sessions (stamped 12:00) dated
--      2026-06-22 or later — your real in-app workouts (saved at midnight)
--      and genuinely-trained past history (through 2026-06-21) are kept;
--   2) sets "Up next" to Girls just wanna have fun · Día 2 (the back day).
-- Safe to run once. After this, logging a day auto-advances normally.
-- ─────────────────────────────────────────────────────────────
do $$
declare uid uuid; pid uuid; wpos int; dpos int; n int;
begin
  select id into uid from users where lower(email) = lower('yaczoe@gmail.com');
  if uid is null then raise exception 'Registra yaczoe@gmail.com primero.'; end if;
  select id into pid from plans where user_id = uid and name = 'WELLNESS' limit 1;
  if pid is null then raise exception 'No existe el plan WELLNESS.'; end if;

  delete from workouts
   where user_id = uid and plan_id = pid
     and performed_at::time = time '12:00:00'
     and performed_at::date >= date '2026-06-22';
  get diagnostics n = row_count;
  raise notice 'Eliminadas % sesiones importadas no entrenadas (>= 2026-06-22).', n;

  select w.position into wpos from plan_weeks w
   where w.plan_id = pid and w.name = 'Girls just wanna have fun' limit 1;
  select d.position into dpos from plan_days d join plan_weeks w on w.id = d.week_id
   where w.plan_id = pid and w.position = wpos and d.name = 'Día 2' limit 1;

  update plans set current_week = coalesce(wpos,0), next_index = coalesce(dpos,1) where id = pid;
  raise notice 'Up next = Girls just wanna have fun, Día 2 (semana %, día pos %).', wpos, dpos;
end $$;
