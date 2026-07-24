-- ─────────────────────────────────────────────────────────────
-- Lift & Inspire — Normalize exercise equipment to English
-- So the "You'll need" chips read consistently. Idempotent; run once in
-- the Supabase SQL editor. (The app also normalizes at display time, so this
-- is optional but keeps the stored data clean.)
-- ─────────────────────────────────────────────────────────────
update exercises set equipment = 'Barbell'    where lower(equipment) in ('barra');
update exercises set equipment = 'Dumbbell'   where lower(equipment) in ('mancuernas', 'mancuerna');
update exercises set equipment = 'Machine'    where lower(equipment) in ('máquina', 'maquina');
update exercises set equipment = 'Cable'      where lower(equipment) in ('polea');
update exercises set equipment = 'Bodyweight' where lower(equipment) in ('peso corporal');
update exercises set equipment = 'Band'       where lower(equipment) in ('banda');
