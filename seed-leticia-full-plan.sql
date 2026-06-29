-- ─────────────────────────────────────────────────────────────
-- Leticia — FULL plan (5 weeks x 4 days), translated to English.
-- Run in the Supabase SQL editor (production).
-- STEP 1 ensures the exercises exist in the shared catalog.
-- STEP 2 creates a brand-new active plan for Leticia with every day filled.
-- ⚠️ EDIT Leticia's email on the marked line before running.
-- (Re-running creates ANOTHER plan; delete duplicates from /admin if needed.)
-- ─────────────────────────────────────────────────────────────

-- STEP 1 — catalog (insert only the missing ones)
insert into exercises (name, muscle_group, equipment, owner_id)
select v.name, v.muscle_group, v.equipment, null from (values
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
where not exists (select 1 from exercises e where lower(e.name)=lower(v.name) and e.owner_id is null);

-- STEP 2 — build the plan
do $$
declare v_user uuid; v_plan uuid; v_week uuid; v_day uuid;
begin
  select id into v_user from users where lower(email) = lower('LETICIA_EMAIL_AQUI') limit 1;
  if v_user is null then raise exception 'No encontré a Leticia (revisa el correo).'; end if;
  update plans set is_active = false where user_id = v_user;
  insert into plans (user_id, name, objective, weeks, is_active, next_index, current_week)
    values (v_user, 'Mesociclo VME', 'Glúteos / tren inferior + superior', 5, true, 0, 0) returning id into v_plan;

  insert into plan_weeks (plan_id, position, name, notes) values (v_plan, 0, 'Semana 1', 'Adaptación técnica VME semana 1, con 3 en reserva.') returning id into v_week;
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 0, 'Día 1', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Hip Thrust') and owner_id is null limit 1), 3, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Deficit Bulgarian Split Squat') and owner_id is null limit 1), 2, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Hack Squat') and owner_id is null limit 1), 2, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Step Up') and owner_id is null limit 1), 2, '8-12', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Leg Extension') and owner_id is null limit 1), 2, '12-15', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 2, '12-20', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Crunch') and owner_id is null limit 1), 2, '12-20', '3', '60% 1RM · RPE 7';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 1, 'Día 2', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Overhand Lat Pulldown') and owner_id is null limit 1), 3, '8-10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Cable Row') and owner_id is null limit 1), 3, '10', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 2, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Single-Arm Cable Lateral Raise') and owner_id is null limit 1), 3, '12-15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Incline Bench Press') and owner_id is null limit 1), 2, '8', '1-2', '60% 1RM · RPE 8-9';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Low Cable Curl') and owner_id is null limit 1), 2, '12', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Cable Pushdown (Rope)') and owner_id is null limit 1), 2, '12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 2, 'Día 3', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Barbell Romanian Deadlift') and owner_id is null limit 1), 3, '6-8', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('KAS Glute Bridge') and owner_id is null limit 1), 4, '10', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Lying Leg Curl') and owner_id is null limit 1), 3, '10-12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Back Extension (Roman Chair)') and owner_id is null limit 1), 2, '12-15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Cable Glute Kickback') and owner_id is null limit 1), 2, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 2, '20', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Low Plank (Forearm Plank)') and owner_id is null limit 1), 2, 'Max', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 3, 'Día 4', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Machine Row') and owner_id is null limit 1), 3, '10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Close-Grip (V-Bar) Lat Pulldown') and owner_id is null limit 1), 2, '12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Dumbbell Lateral Raise') and owner_id is null limit 1), 2, '10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 2, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Hammer Curl') and owner_id is null limit 1), 2, '15', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Two-Hand Overhead Extension') and owner_id is null limit 1), 2, '12', '2-3', '60% 1RM · RPE 7-8';

  insert into plan_weeks (plan_id, position, name, notes) values (v_plan, 1, 'Semana 2', 'Acumulación 10-15%. Subimos una serie en cada ejercicio. Objetivo: mejorar ejecución, más tensión mecánica, progresión de carga.') returning id into v_week;
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 0, 'Día 1', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Hip Thrust') and owner_id is null limit 1), 4, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Deficit Bulgarian Split Squat') and owner_id is null limit 1), 3, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Hack Squat') and owner_id is null limit 1), 3, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Step Up') and owner_id is null limit 1), 3, '8-12', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Leg Extension') and owner_id is null limit 1), 3, '12-15', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 3, '12-20', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Crunch') and owner_id is null limit 1), 3, '12-20', '3', '60% 1RM · RPE 7';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 1, 'Día 2', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Overhand Lat Pulldown') and owner_id is null limit 1), 4, '8-10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Cable Row') and owner_id is null limit 1), 4, '10', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Single-Arm Cable Lateral Raise') and owner_id is null limit 1), 4, '12-15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Incline Bench Press') and owner_id is null limit 1), 3, '8', '1-2', '60% 1RM · RPE 8-9';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Low Cable Curl') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Cable Pushdown (Rope)') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 2, 'Día 3', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Barbell Romanian Deadlift') and owner_id is null limit 1), 4, '6-8', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('KAS Glute Bridge') and owner_id is null limit 1), 3, '10', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Lying Leg Curl') and owner_id is null limit 1), 4, '10-12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Back Extension (Roman Chair)') and owner_id is null limit 1), 3, '12-15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Cable Glute Kickback') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 3, '20', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Low Plank (Forearm Plank)') and owner_id is null limit 1), 3, 'Max', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 3, 'Día 4', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Machine Row') and owner_id is null limit 1), 4, '10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Close-Grip (V-Bar) Lat Pulldown') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Dumbbell Lateral Raise') and owner_id is null limit 1), 3, '10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Hammer Curl') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Two-Hand Overhead Extension') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7-8';

  insert into plan_weeks (plan_id, position, name, notes) values (v_plan, 2, 'Semana 3', '') returning id into v_week;
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 0, 'Día 1', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Smith Machine Hip Thrust') and owner_id is null limit 1), 4, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Reverse Lunge') and owner_id is null limit 1), 3, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Leg Press') and owner_id is null limit 1), 3, '6-10', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Deficit Step Up') and owner_id is null limit 1), 3, '8-12', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Leg Extension') and owner_id is null limit 1), 3, '12-15', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 3, '12-20', '3', '60% 1RM · RPE 7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Crunch') and owner_id is null limit 1), 3, '12-20', '3', '60% 1RM · RPE 7';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 1, 'Día 2', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Overhand Lat Pulldown') and owner_id is null limit 1), 4, '8-10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Pulldown') and owner_id is null limit 1), 4, '10', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Single-Arm Cable Lateral Raise') and owner_id is null limit 1), 4, '12-15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Dumbbell Bench Press') and owner_id is null limit 1), 3, '8', '1-2', '60% 1RM · RPE 8-9';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Low Cable Curl') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Cable Pushdown (Rope)') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 2, 'Día 3', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Barbell Romanian Deadlift') and owner_id is null limit 1), 4, '6-8', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('KAS Glute Bridge') and owner_id is null limit 1), 3, '10', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Lying Leg Curl') and owner_id is null limit 1), 4, '10-12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Back Extension (Roman Chair)') and owner_id is null limit 1), 3, '12-15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Cable Glute Kickback') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 3, '20', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Low Plank (Forearm Plank)') and owner_id is null limit 1), 3, 'Max', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 3, 'Día 4', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Machine Row') and owner_id is null limit 1), 4, '10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Close-Grip (V-Bar) Lat Pulldown') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Dumbbell Lateral Raise') and owner_id is null limit 1), 3, '10', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7-8';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Hammer Curl') and owner_id is null limit 1), 3, '15', '2-3', '60% 1RM · RPE 7.5';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Two-Hand Overhead Extension') and owner_id is null limit 1), 3, '12', '2-3', '60% 1RM · RPE 7-8';

  insert into plan_weeks (plan_id, position, name, notes) values (v_plan, 3, 'Semana 4', 'Cerca del fallo técnico en la mayoría de los ejercicios.') returning id into v_week;
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 0, 'Día 1', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Smith Machine Hip Thrust') and owner_id is null limit 1), 4, '6-10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Reverse Lunge') and owner_id is null limit 1), 3, '6-10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Leg Press') and owner_id is null limit 1), 4, '6-10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Deficit Step Up') and owner_id is null limit 1), 4, '8-12', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Leg Extension') and owner_id is null limit 1), 3, '12-15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 4, '12-20', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Crunch') and owner_id is null limit 1), 3, '12-20', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 1, 'Día 2', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Overhand Lat Pulldown') and owner_id is null limit 1), 4, '8-10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Pulldown') and owner_id is null limit 1), 4, '10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Single-Arm Cable Lateral Raise') and owner_id is null limit 1), 4, '12-15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Dumbbell Bench Press') and owner_id is null limit 1), 3, '8', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Low Cable Curl') and owner_id is null limit 1), 3, '12', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Cable Pushdown (Rope)') and owner_id is null limit 1), 3, '12', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 2, 'Día 3', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Barbell Romanian Deadlift') and owner_id is null limit 1), 4, '6-8', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('KAS Glute Bridge') and owner_id is null limit 1), 3, '10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Lying Leg Curl') and owner_id is null limit 1), 4, '10-12', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Back Extension (Roman Chair)') and owner_id is null limit 1), 4, '12-15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Cable Glute Kickback') and owner_id is null limit 1), 4, '15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 4, '20', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Low Plank (Forearm Plank)') and owner_id is null limit 1), 3, 'Max', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 3, 'Día 4', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Machine Row') and owner_id is null limit 1), 4, '10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Close-Grip (V-Bar) Lat Pulldown') and owner_id is null limit 1), 3, '12', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Dumbbell Lateral Raise') and owner_id is null limit 1), 4, '10', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Hammer Curl') and owner_id is null limit 1), 4, '15', '0-1', '80-90% 1RM · RPE 9-10';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Two-Hand Overhead Extension') and owner_id is null limit 1), 3, '12', '0-1', '80-90% 1RM · RPE 9-10';

  insert into plan_weeks (plan_id, position, name, notes) values (v_plan, 4, 'Semana 5', 'Deload: bajar intensidad y volumen.') returning id into v_week;
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 0, 'Día 1', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Smith Machine Hip Thrust') and owner_id is null limit 1), 2, '6-10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Reverse Lunge') and owner_id is null limit 1), 2, '6-10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Leg Press') and owner_id is null limit 1), 2, '6-10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Deficit Step Up') and owner_id is null limit 1), 2, '8-12', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Leg Extension') and owner_id is null limit 1), 3, '12-15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 2, '12-20', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Crunch') and owner_id is null limit 1), 3, '12-20', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 1, 'Día 2', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Overhand Lat Pulldown') and owner_id is null limit 1), 2, '8-10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Pulldown') and owner_id is null limit 1), 2, '10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Single-Arm Cable Lateral Raise') and owner_id is null limit 1), 2, '12-15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Dumbbell Bench Press') and owner_id is null limit 1), 3, '8', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Low Cable Curl') and owner_id is null limit 1), 2, '12', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Cable Pushdown (Rope)') and owner_id is null limit 1), 3, '12', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 2, 'Día 3', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Barbell Romanian Deadlift') and owner_id is null limit 1), 2, '6-8', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('KAS Glute Bridge') and owner_id is null limit 1), 3, '10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Lying Leg Curl') and owner_id is null limit 1), 2, '10-12', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Back Extension (Roman Chair)') and owner_id is null limit 1), 2, '12-15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Cable Glute Kickback') and owner_id is null limit 1), 2, '15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Hip Abduction') and owner_id is null limit 1), 2, '20', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 6, (select id from exercises where lower(name)=lower('Low Plank (Forearm Plank)') and owner_id is null limit 1), 3, 'Max', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_days (plan_id, week_id, position, name, notes) values (v_plan, v_week, 3, 'Día 4', '') returning id into v_day;
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 0, (select id from exercises where lower(name)=lower('Machine Row') and owner_id is null limit 1), 2, '10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 1, (select id from exercises where lower(name)=lower('Close-Grip (V-Bar) Lat Pulldown') and owner_id is null limit 1), 3, '12', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 2, (select id from exercises where lower(name)=lower('Dumbbell Lateral Raise') and owner_id is null limit 1), 2, '10', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 3, (select id from exercises where lower(name)=lower('Face Pull') and owner_id is null limit 1), 3, '15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 4, (select id from exercises where lower(name)=lower('Hammer Curl') and owner_id is null limit 1), 2, '15', '3-4', '50-60% 1RM · RPE 6-7';
  insert into plan_exercises (day_id, position, exercise_id, sets, reps, rir, notes) select v_day, 5, (select id from exercises where lower(name)=lower('Two-Hand Overhead Extension') and owner_id is null limit 1), 2, '12', '3-4', '50-60% 1RM · RPE 6-7';

  raise notice 'Plan completo de Leticia creado (5 semanas x 4 días).';
end $$;
