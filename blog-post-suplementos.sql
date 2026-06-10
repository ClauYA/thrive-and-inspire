-- ─────────────────────────────────────────────────────────────
-- Blog post: Guía de Suplementos (resumen)
-- Run this once in the Supabase SQL editor to publish the post.
-- ─────────────────────────────────────────────────────────────
insert into posts (slug, title, excerpt, content, author, published)
values (
  'guia-suplementos',
  'Guía de Suplementos: Qué Vale la Pena y Qué No (Según la Ciencia)',
  'Solo ~10% de los suplementos valen la pena. Esta guía basada en evidencia te dice en cuáles invertir tu dinero y en cuáles no — de la proteína y la creatina a los quemadores de grasa.',
  $guia$
La mayoría de los suplementos que nos venden hoy en día **no son mágicos**. De hecho, solo cerca del **10% valen la pena**, y ninguno funcionará si la base — tu **dieta** y tu **entrenamiento** — no está bien estructurada.

> Antes de pensar en suplementos, organiza todo lo demás. Te darán más del **80% de tus resultados** la alimentación y el entrenamiento. Los suplementos son la cereza del pastel, no el pastel.

## El orden de prioridades

1. Calorías, macros y micronutrientes
2. Entrenamiento
3. Monitoreo de resultados
4. Tiempo y número de comidas
5. **Suplementos** ← el último lugar

## 3 factores para que un suplemento funcione

- **Tiempo:** muchos funcionan por acumulación; sé constante y no esperes resultados en días.
- **Cantidad:** la dosis correcta suele ser individual. Más no siempre es mejor.
- **Momento del día:** algunos rinden mejor en momentos específicos.

Y al comprar, busca **sellos de calidad** (por ejemplo *Creapure* en la creatina).

---

## Los suplementos, uno por uno

### 1. Proteína en polvo (Whey) — ✅ Útil (práctica, no mágica)
No es más que **proteína del suero de la leche**: la misma que obtienes de carne, pollo, huevos o pescado, pero más cómoda. No te hace ganar músculo ni perder grasa por sí sola.
- **Tipos:** *concentrada* (más económica), *aislada* (menos grasa/lactosa) e *hidrolizada* (más fácil de digerir).
- **Dosis:** 20–40 g antes o después de entrenar; sin límite diario si eres una persona sana.
- Sin pausas, sin "efecto rebote". Da igual antes o después de entrenar — lo importante es **cumplir tus requerimientos de proteína del día**.

### 2. Mass Gainer (ganador de peso) — ⚠️ Situacional
No construye músculo; solo aporta **muchas calorías** (sobre todo carbohidratos) para quien batalla por llegar a sus requerimientos en etapa de aumento. Innecesario si ya alcanzas tus calorías con comida.

### 3. BCAA / Aminoácidos — ⚠️ Solo en casos específicos
Si llevas una dieta **alta en proteína animal**, son un desperdicio ("llevar arena a la playa"). Pueden ser útiles para **veganos** o dietas basadas en proteína vegetal (mínimo ~4 g, siempre acompañados de otra proteína).

### 4. Creatina — ✅✅ La más respaldada y segura
Uno de los suplementos con **mayor evidencia científica**.
- Mejora fuerza, potencia y rendimiento; preserva y ayuda a ganar masa muscular; tiene beneficios para la salud y la edad.
- **Tipo:** monohidrato (busca el sello *Creapure*).
- **Dosis:** ~0,1 g por kg de peso al día (ej. 80 kg → ~8 g), **todos los días**, entrenes o no. No requiere fase de carga.
- **Mitos:** no causa caída de cabello ni retención de líquido subcutánea (solo hidrata el músculo por dentro).

### 5. L-Carnitina — ❌ Innecesaria
Tu cuerpo ya produce la suficiente. No se ha demostrado en humanos que aumente la quema de grasa ni el rendimiento.

### 6. CLA — ❌ Innecesario
Los alimentos de origen animal ya aportan lo necesario. Sin evidencia de que ayude a perder grasa.

### 7. Cafeína — ✅ Muy útil
Junto con la creatina, de **mayor evidencia**. Mejora energía, enfoque, rendimiento y es el único suplemento legal y seguro que puede ayudar (un poco) con la pérdida de grasa.
- **Dosis:** 200–400 mg, ~45 min antes de entrenar. Evítala por la tarde para no afectar el sueño.
- Ojo con efectos: ansiedad, insomnio, taquicardia. Mide tu tolerancia.

### 8. Vitamina D — ✅ Recomendable (el déficit es muy común)
Más que vitamina, funciona casi como hormona. Su déficit es muy frecuente por poca exposición solar.
- Beneficios: salud, masa muscular, fuerza, testosterona, síntesis proteica.
- **Dosis:** 2.000–4.000 UI de **D3** al día, junto a una comida con grasa. ¡Y toma sol! ☀️

### 9. Vitamina C y E — ❌ Innecesarias (con buena dieta)
Si entrenas y comes bien sin restringir grupos de alimentos, no aportan beneficios al rendimiento. Dosis altas pueden ser contraproducentes.

### 10. Omega 3 — ⚠️ Situacional
Útil en **veganos, adultos mayores, déficit calórico, lesiones** o si no comes pescado azul (sardina, salmón, atún) 2–4 veces por semana.
- **Dosis:** 1–2 g al día (en forma de **triglicéridos**, no etil-éster). No te excedas.

### 11. Pre-workout — ⚠️ Mejor cafeína sola
Suelen ser **cafeína + relleno** (beta-alanina, citrulina, taurina…) con dosis pequeñas y poca evidencia. Si buscas el efecto, la **cafeína aislada** es más eficiente.

---

## En resumen

Si tu dieta, entrenamiento y descanso están en orden, los pocos que de verdad valen la pena para la mayoría son:

- 💪 **Creatina** (monohidrato)
- ☕ **Cafeína**
- ☀️ **Vitamina D** (si hay déficit)
- 🥤 **Proteína en polvo** (por practicidad)
- 🐟 **Omega 3** (según tu caso)

El resto, en la mayoría de los casos, es **gastar dinero**. Primero la base; luego, y solo luego, piensa en suplementos.

*Resumen basado en la "Guía Completa sobre Suplementos Alimenticios" de Daniel Duque, con fines educativos.*
  $guia$,
  'Claudia Bittner',
  true
)
on conflict (slug) do update
  set title = excluded.title,
      excerpt = excluded.excerpt,
      content = excluded.content,
      published = excluded.published,
      updated_at = now();
