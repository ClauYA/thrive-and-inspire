-- ─────────────────────────────────────────────────────────────
-- Arreglo — Series de Cecilia
-- En su plan quedaron series corruptas (33, 323, 23…) cuando debían ser 3.
-- Corre PRIMERO el paso (1) para confirmar que es la persona correcta,
-- y luego el paso (2) para arreglarlo. Ambos son seguros y repetibles.
-- ─────────────────────────────────────────────────────────────

-- (1) PREVISUALIZAR — planes de Cecilia y sus series actuales
select u.email, u.name, p.name as plan, p.is_active,
       count(pe.*)     as ejercicios,
       min(pe.sets)    as min_series,
       max(pe.sets)    as max_series
from users u
join plans p            on p.user_id = u.id
join plan_days d        on d.plan_id = p.id
join plan_exercises pe  on pe.day_id = d.id
where u.name ilike '%cecilia%' or lower(u.email) like '%cecilia%'
group by u.email, u.name, p.name, p.is_active
order by p.is_active desc;

-- (2) ARREGLAR — poner 3 series a TODOS los ejercicios de Cecilia
update plan_exercises set sets = 3
where day_id in (
  select d.id
  from plan_days d
  join plans p on p.id = d.plan_id
  join users u on u.id = p.user_id
  where u.name ilike '%cecilia%' or lower(u.email) like '%cecilia%'
);
