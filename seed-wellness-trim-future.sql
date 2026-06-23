-- ─────────────────────────────────────────────────────────────
-- Remove the imported "program" sessions that were NOT actually trained
-- in the app, so your real logged workouts are what shows in History.
--
-- The Excel import stamped every session at 12:00; the app saves real
-- workouts at 00:00 (midnight). So we delete only imported sessions
-- (time = 12:00) dated 2026-06-22 or later — that clears the future weeks
-- and the duplicate "Día 2" from the Excel, while keeping:
--   • your real Día 2 logged today (midnight), and
--   • all genuinely-trained past history (through 2026-06-21).
-- Safe to run once.
-- ─────────────────────────────────────────────────────────────
do $$
declare uid uuid; pid uuid; n int;
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
end $$;
