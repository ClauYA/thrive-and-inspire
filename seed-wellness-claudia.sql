-- ─────────────────────────────────────────────────────────────
-- Pre-load the WELLNESS mesocycle (8 weeks) for Claudia.
--
-- Run AFTER: schema-plans.sql  +  schema-plan-weeks.sql
-- and AFTER the account yaczoe@gmail.com has registered at /login.
--
-- Creates the mesocycle WELLNESS with its 8 weeks (Come back … Sunflower),
-- each with one starter day "Día 1". Add the exercises + targets from the
-- members editor (/app/plans). Safe to run once — it skips if WELLNESS
-- already exists for this user.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  uid       uuid;
  plan_id   uuid;
  wid       uuid;
  wk        text;
  i         int := 0;
  weeks     text[] := array[
    'Come back (1)',
    'Yellow Ledbetter (2)',
    'Dont Cry (3)',
    'November rain (4)',
    'Stranged (5)',
    'Girls just wanna have fun (6)',
    'im not the highway (7)',
    'Sunflower (8)'
  ];
begin
  select id into uid from users where lower(email) = lower('yaczoe@gmail.com');
  if uid is null then
    raise exception 'No existe usuario con email yaczoe@gmail.com. Regístrate primero en /login y vuelve a correr esto.';
  end if;

  if exists (select 1 from plans where user_id = uid and name = 'WELLNESS') then
    raise notice 'Ya existe un plan WELLNESS para este usuario; no se crea de nuevo.';
    return;
  end if;

  insert into plans (user_id, name, objective, weeks, end_date, is_active, current_week, next_index)
  values (uid, 'WELLNESS', 'Acumulación y descarga Wellness', 8, '2026-06-30', true, 0, 0)
  returning id into plan_id;

  -- Make WELLNESS the only active plan for this user.
  update plans set is_active = (id = plan_id) where user_id = uid;

  foreach wk in array weeks loop
    insert into plan_weeks (plan_id, position, name) values (plan_id, i, wk) returning id into wid;
    insert into plan_days (plan_id, week_id, position, name) values (plan_id, wid, 0, 'Día 1');
    i := i + 1;
  end loop;

  raise notice 'WELLNESS creado con 8 semanas (Come back … Sunflower).';
end $$;
