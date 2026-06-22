-- ─────────────────────────────────────────────────────────────
-- Set WELLNESS "Up next" to where Claudia actually is.
-- As of 2026-06-22: Día 1 of "Girls just wanna have fun" is done, so the
-- next session is Día 2 of that week.
--
-- You normally never need this: the app advances the pointer automatically
-- after you log a planned day. This just corrects the starting point once.
-- Run AFTER seed-wellness-claudia.sql.
-- ─────────────────────────────────────────────────────────────
do $$
declare uid uuid; pid uuid; wpos int; dpos int;
begin
  select id into uid from users where lower(email) = lower('yaczoe@gmail.com');
  if uid is null then raise exception 'Registra yaczoe@gmail.com primero.'; end if;
  select id into pid from plans where user_id = uid and name = 'WELLNESS' limit 1;
  if pid is null then raise exception 'No existe el plan WELLNESS.'; end if;

  select w.position into wpos from plan_weeks w
   where w.plan_id = pid and w.name = 'Girls just wanna have fun' limit 1;
  select d.position into dpos from plan_days d join plan_weeks w on w.id = d.week_id
   where w.plan_id = pid and w.position = wpos and d.name = 'Día 2' limit 1;

  update plans set current_week = coalesce(wpos,0), next_index = coalesce(dpos,1) where id = pid;
  raise notice 'Up next = "Girls just wanna have fun" (semana %), Día 2 (pos %).', wpos, dpos;
end $$;
