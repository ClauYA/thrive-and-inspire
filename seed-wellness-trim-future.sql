-- ─────────────────────────────────────────────────────────────
-- Trim WELLNESS history to only what's actually been trained.
-- Removes logged sessions dated AFTER 2026-06-21 (Girls just wanna have
-- fun · Día 1 was the last one really done). The PLAN keeps all weeks
-- through July 3 — you log each future day in-app as you do it.
-- Safe to run once on a DB that already imported the full log.
-- ─────────────────────────────────────────────────────────────
do $$
declare uid uuid; pid uuid; n int;
begin
  select id into uid from users where lower(email) = lower('yaczoe@gmail.com');
  if uid is null then raise exception 'Registra yaczoe@gmail.com primero.'; end if;
  select id into pid from plans where user_id = uid and name = 'WELLNESS' limit 1;
  if pid is null then raise exception 'No existe el plan WELLNESS.'; end if;

  delete from workouts
   where user_id = uid and plan_id = pid and performed_at::date > date '2026-06-21';
  get diagnostics n = row_count;
  raise notice 'Eliminadas % sesiones futuras (posteriores al 2026-06-21).', n;
end $$;
