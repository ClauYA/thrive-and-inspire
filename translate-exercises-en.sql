-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Translate exercises to English
-- Renames the Spanish exercises (and their muscle groups) to English so the
-- catalog/pickers show everything in English. Nothing is deleted, so plans
-- that use these exercises keep working (same rows, new names).
-- Safe to re-run (idempotent). Run once in the Supabase SQL editor.
--
-- STEP 0 (optional) — see which exercises still look Spanish after running
-- STEP 1/2, and paste them to me so I add the missing translations:
--   select id, name, muscle_group, owner_id from exercises
--   where name ~ '[áéíóúñÁÉÍÓÚÑ]'
--      or muscle_group in ('Cuádriceps','Glúteos','Isquiosurales','Pectorales',
--                          'Espalda','Hombros','Bíceps','Tríceps','Abdomen');
-- ─────────────────────────────────────────────────────────────

-- STEP 1 — muscle groups (covers every exercise, any owner)
update exercises set muscle_group = 'Quads'      where muscle_group = 'Cuádriceps';
update exercises set muscle_group = 'Glutes'     where muscle_group = 'Glúteos';
update exercises set muscle_group = 'Hamstrings' where muscle_group = 'Isquiosurales';
update exercises set muscle_group = 'Chest'      where muscle_group = 'Pectorales';
update exercises set muscle_group = 'Back'       where muscle_group = 'Espalda';
update exercises set muscle_group = 'Shoulders'  where muscle_group = 'Hombros';
update exercises set muscle_group = 'Biceps'     where muscle_group = 'Bíceps';
update exercises set muscle_group = 'Triceps'    where muscle_group = 'Tríceps';
update exercises set muscle_group = 'Core'       where muscle_group = 'Abdomen';

-- STEP 2 — exercise names (match by current Spanish name, any owner)
update exercises set name = 'Back Squat'                          where lower(name) = lower('Sentadilla libre de competencia');
update exercises set name = 'Bench Press'                         where lower(name) = lower('Press banca');
update exercises set name = 'Incline Dumbbell Press'              where lower(name) = lower('Press de Pecho Inclinado con Mancuernas');
update exercises set name = 'Single-Leg Leg Extension'            where lower(name) = lower('Extensión de rodilla unilateral en máquina');
update exercises set name = 'Cable JM Press'                      where lower(name) = lower('JM Press con cable');
update exercises set name = 'Standing Cable Hip Abduction'        where lower(name) = lower('Abducción de cadera de pie con grillete en polea baja');
update exercises set name = 'Conventional Deadlift'               where lower(name) = lower('Peso muerto convencional');
update exercises set name = 'Weighted Pull-Up'                    where lower(name) = lower('Dominada prono con lastre');
update exercises set name = 'Seated Machine Row'                  where lower(name) = lower('Remo sentado en máquina');
update exercises set name = 'Barbell Hip Thrust (Slow Eccentric)' where lower(name) = lower('Hip thrust tradicional con barra - excéntrico 3-4 segundos');
update exercises set name = 'Lying Leg Curl'                      where lower(name) = lower('Curl para isquiosurales acostado en máquina');
update exercises set name = 'Cable Glute Kickback'                where lower(name) = lower('Patada para glúteo con grillete en polea baja');
update exercises set name = 'Cable Rope Biceps Curl'              where lower(name) = lower('Curl de bíceps con soga polea baja');
update exercises set name = 'Crunch'                              where lower(name) = lower('Crunch abdominal');
update exercises set name = 'Parallel Bar Triceps Dip'            where lower(name) = lower('Fondos para tríceps en paralelas');
update exercises set name = 'Seated Dumbbell Shoulder Press'      where lower(name) = lower('Prensa militar sentado con mancuernas');
update exercises set name = 'Single-Arm Cable Lateral Raise'      where lower(name) = lower('Copa a una mano con polea intermedia (Estabilidad adicional)');
update exercises set name = 'Cross-Cable Lateral Raise (Long Partials)' where lower(name) = lower('Elevaciones laterales cruzadas con polea en posición intermedia - parciales largas');
update exercises set name = 'Bird Dog'                            where lower(name) = lower('bird dog');
update exercises set name = 'Barbell Front Squat'                 where lower(name) = lower('Sentadilla frontal con barra');
update exercises set name = 'Barbell Bulgarian Split Squat'       where lower(name) = lower('Sentadilla búlgara con barra');
update exercises set name = 'Seated Leg Extension'                where lower(name) = lower('Extensión para cuádriceps sentado en máquina');
update exercises set name = 'Seated Machine Hip Abduction'        where lower(name) = lower('Abducción de cadera sentado en máquina');
update exercises set name = 'Glute Bridge'                        where lower(name) = lower('Puente de glúteo');
update exercises set name = 'Seated Leg Curl'                     where lower(name) = lower('Curl para isquiosurales sentado en máquina');
update exercises set name = 'Standing Dumbbell Lateral Raise'     where lower(name) = lower('Elevaciones laterales de pie con mancuernas');
