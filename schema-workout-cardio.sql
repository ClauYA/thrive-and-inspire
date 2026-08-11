-- Cardio logged alongside a workout (nullable).
-- { type, duration, distance, pulse, rpe, notes }
alter table workouts add column if not exists cardio jsonb default null;
