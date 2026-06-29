-- ─────────────────────────────────────────────────────────────
-- Leticia — Day 3 & Day 4 (all 5 weeks), translated to English.
-- Run in the Supabase SQL editor (production).
-- STEP 1 below ensures the exercises exist in the shared catalog.
-- STEP 2 fills ONLY Day 3 (position 2) and Day 4 (position 3) of each
-- week of Leticia's plan. It clears those two days first, so it is
-- safe to re-run and never touches Day 1 or Day 2.
-- ⚠️ EDIT the email on the marked line before running.
-- ─────────────────────────────────────────────────────────────

-- STEP 1 — ensure catalog exercises (insert only the missing ones)
insert into exercises (name, muscle_group, equipment, owner_id)
select v.name, v.muscle_group, v.equipment, null
from (values
  ('Hip Thrust', 'Glutes', 'Barbell'),
  ('Smith Machine Hip Thrust', 'Glutes', 'Machine'),
  ('Deficit Bulgarian Split Squat', 'Glutes', 'Dumbbell'),
  ('Hack Squat', 'Quads', 'Machine'),
  ('Step Up', 'Glutes', 'Bodyweight'),
  ('Deficit Step Up', 'Glutes', 'Bodyweight'),
  ('Reverse Lunge', 'Glutes', 'Bodyweight'),
  ('Leg Press', 'Quads', 'Machine'),
  ('Leg Extension', 'Quads', 'Machine'),
  ('Hip Abduction', 'Glutes', 'Machine'),
  ('Crunch', 'Core', 'Bodyweight'),
  ('Overhand Lat Pulldown', 'Back', 'Cable'),
  ('Cable Row', 'Back', 'Cable'),
  ('Face Pull', 'Shoulders', 'Cable'),
  ('Single-Arm Cable Lateral Raise', 'Shoulders', 'Cable'),
  ('Incline Bench Press', 'Chest', 'Barbell'),
  ('Dumbbell Bench Press', 'Chest', 'Dumbbell'),
  ('Low Cable Curl', 'Biceps', 'Cable'),
  ('Cable Pushdown (Rope)', 'Triceps', 'Cable'),
  ('Pulldown', 'Back', 'Cable'),
  ('Barbell Romanian Deadlift', 'Hamstrings', 'Barbell'),
  ('KAS Glute Bridge', 'Glutes', 'Barbell'),
  ('Lying Leg Curl', 'Hamstrings', 'Machine'),
  ('Back Extension (Roman Chair)', 'Glutes', 'Bodyweight'),
  ('Cable Glute Kickback', 'Glutes', 'Cable'),
  ('Low Plank (Forearm Plank)', 'Core', 'Bodyweight'),
  ('Machine Row', 'Back', 'Machine'),
  ('Close-Grip (V-Bar) Lat Pulldown', 'Back', 'Cable'),
  ('Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell'),
  ('Hammer Curl', 'Biceps', 'Dumbbell'),
  ('Two-Hand Overhead Extension', 'Triceps', 'Dumbbell')
) as v(name, muscle_group, equipment)
where not exists (select 1 from exercises e where lower(e.name) = lower(v.name) and e.owner_id is null);

-- STEP 2 — fill Leticia's Day 3 & Day 4
do $$
declare
  v_user uuid;
  v_plan uuid;
  v_day  uuid;
begin
  -- 👇 PON AQUÍ EL CORREO DE LETICIA
  select id into v_user from users where lower(email) = lower('LETICIA_EMAIL_AQUI') limit 1;
  -- (alternativa por nombre: select id into v_user from users where name ilike '%leticia%' limit 1;)
  if v_user is null then raise exception 'No encontré a Leticia (revisa el correo).'; end if;
  select id into v_plan from plans where user_id = v_user order by is_active desc, created_at desc limit 1;
  if v_plan is null then raise exception 'Leticia no tiene un plan creado.'; end if;

  -- Semana 1 · Día 3
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 0 and d.position = 2 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 3, '6-8', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Barbell Romanian Deadlift') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 4, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('KAS Glute Bridge') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 3, '10-12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Lying Leg Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 2, '12-15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Back Extension (Roman Chair)') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 2, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Cable Glute Kickback') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 2, '20', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Hip Abduction') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, e.id, 2, 'Max', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Low Plank (Forearm Plank)') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 1 Día 3: no existe ese día (posición 2).';
  end if;

  -- Semana 1 · Día 4
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 0 and d.position = 3 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 3, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Machine Row') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 2, '12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Close-Grip (V-Bar) Lat Pulldown') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 2, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Dumbbell Lateral Raise') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 2, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Face Pull') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 2, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Hammer Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 2, '12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Two-Hand Overhead Extension') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 1 Día 4: no existe ese día (posición 3).';
  end if;

  -- Semana 2 · Día 3
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 1 and d.position = 2 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 4, '6-8', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Barbell Romanian Deadlift') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('KAS Glute Bridge') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 4, '10-12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Lying Leg Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 3, '12-15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Back Extension (Roman Chair)') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 3, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Cable Glute Kickback') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 3, '20', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Hip Abduction') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, e.id, 3, 'Max', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Low Plank (Forearm Plank)') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 2 Día 3: no existe ese día (posición 2).';
  end if;

  -- Semana 2 · Día 4
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 1 and d.position = 3 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 4, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Machine Row') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Close-Grip (V-Bar) Lat Pulldown') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 3, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Dumbbell Lateral Raise') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 3, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Face Pull') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 3, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Hammer Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 3, '12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Two-Hand Overhead Extension') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 2 Día 4: no existe ese día (posición 3).';
  end if;

  -- Semana 3 · Día 3
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 2 and d.position = 2 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 4, '6-8', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Barbell Romanian Deadlift') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('KAS Glute Bridge') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 4, '10-12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Lying Leg Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 3, '12-15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Back Extension (Roman Chair)') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 3, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Cable Glute Kickback') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 3, '20', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Hip Abduction') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, e.id, 3, 'Max', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Low Plank (Forearm Plank)') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 3 Día 3: no existe ese día (posición 2).';
  end if;

  -- Semana 3 · Día 4
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 2 and d.position = 3 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 4, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Machine Row') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Close-Grip (V-Bar) Lat Pulldown') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 3, '10', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Dumbbell Lateral Raise') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 3, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Face Pull') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 3, '15', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Hammer Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 3, '12', '2-3', '60% 1RM' from exercises e where lower(e.name) = lower('Two-Hand Overhead Extension') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 3 Día 4: no existe ese día (posición 3).';
  end if;

  -- Semana 4 · Día 3
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 3 and d.position = 2 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 4, '6-8', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Barbell Romanian Deadlift') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '10', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('KAS Glute Bridge') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 4, '10-12', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Lying Leg Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 4, '12-15', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Back Extension (Roman Chair)') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 4, '15', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Cable Glute Kickback') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 4, '20', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Hip Abduction') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, e.id, 3, 'Max', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Low Plank (Forearm Plank)') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 4 Día 3: no existe ese día (posición 2).';
  end if;

  -- Semana 4 · Día 4
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 3 and d.position = 3 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 4, '10', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Machine Row') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '12', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Close-Grip (V-Bar) Lat Pulldown') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 4, '10', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Dumbbell Lateral Raise') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 3, '15', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Face Pull') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 4, '15', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Hammer Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 3, '12', '0-1', '80-90% 1RM' from exercises e where lower(e.name) = lower('Two-Hand Overhead Extension') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 4 Día 4: no existe ese día (posición 3).';
  end if;

  -- Semana 5 · Día 3
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 4 and d.position = 2 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 2, '6-8', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Barbell Romanian Deadlift') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '10', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('KAS Glute Bridge') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 2, '10-12', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Lying Leg Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 2, '12-15', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Back Extension (Roman Chair)') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 2, '15', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Cable Glute Kickback') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 2, '20', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Hip Abduction') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, e.id, 3, 'Max', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Low Plank (Forearm Plank)') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 5 Día 3: no existe ese día (posición 2).';
  end if;

  -- Semana 5 · Día 4
  select d.id into v_day from plan_days d join plan_weeks w on w.id = d.week_id
    where w.plan_id = v_plan and w.position = 4 and d.position = 3 limit 1;
  if v_day is not null then
    delete from plan_exercises where day_id = v_day;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, e.id, 2, '10', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Machine Row') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, e.id, 3, '12', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Close-Grip (V-Bar) Lat Pulldown') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, e.id, 2, '10', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Dumbbell Lateral Raise') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, e.id, 3, '15', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Face Pull') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, e.id, 2, '15', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Hammer Curl') and e.owner_id is null limit 1;
    insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, e.id, 2, '12', '3-4', '50-60% 1RM' from exercises e where lower(e.name) = lower('Two-Hand Overhead Extension') and e.owner_id is null limit 1;
  else
    raise notice 'Semana 5 Día 4: no existe ese día (posición 3).';
  end if;

  raise notice 'Listo: Día 3 y Día 4 actualizados para Leticia.';
end $$;
