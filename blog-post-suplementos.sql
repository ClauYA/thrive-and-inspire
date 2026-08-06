-- ─────────────────────────────────────────────────────────────
-- Blog: Supplements guide post — Spanish + English, with cover image.
-- Run this once in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────

-- 1) Add a language column to posts (existing posts default to Spanish).
alter table posts add column if not exists lang text default 'es';

-- 2) Spanish version --------------------------------------------------------
insert into posts (slug, title, excerpt, cover_image, content, author, published, lang)
values (
  'guia-suplementos',
  'Guía de Suplementos: Qué Vale la Pena y Qué No (Según la Ciencia)',
  'Solo ~10% de los suplementos valen la pena. Esta guía basada en evidencia te dice en cuáles invertir tu dinero y en cuáles no.',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Protein_shake.jpg',
  $guia$
La mayoría de los suplementos que nos venden hoy en día **no son mágicos**. De hecho, solo cerca del **10% valen la pena**, y ninguno funcionará si la base — tu **dieta** y tu **entrenamiento** — no está bien estructurada.

> Antes de pensar en suplementos, organiza todo lo demás. La alimentación y el entrenamiento te darán más del **80% de tus resultados**. Los suplementos son la cereza del pastel, no el pastel.

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
No es más que **proteína del suero de la leche**, la misma que obtienes de carne, pollo, huevos o pescado, pero más cómoda. No te hace ganar músculo ni perder grasa por sí sola.
- **Tipos:** *concentrada* (más económica), *aislada* (menos grasa/lactosa) e *hidrolizada* (más fácil de digerir).
- **Dosis:** 20–40 g antes o después de entrenar; sin límite diario si eres una persona sana.
- Sin pausas, sin "efecto rebote". Lo importante es **cumplir tus requerimientos de proteína del día**.

### 2. Mass Gainer (ganador de peso) — ⚠️ Situacional
No construye músculo; solo aporta **muchas calorías** para quien batalla por llegar a sus requerimientos en etapa de aumento. Innecesario si ya alcanzas tus calorías con comida.

### 3. BCAA / Aminoácidos — ⚠️ Solo en casos específicos
Si llevas una dieta **alta en proteína animal**, son un desperdicio. Pueden ser útiles para **veganos** o dietas de proteína vegetal (mínimo ~4 g, acompañados de otra proteína).

### 4. Creatina — ✅✅ La más respaldada y segura
Uno de los suplementos con **mayor evidencia científica**.
- Mejora fuerza, potencia y rendimiento; ayuda a ganar y preservar masa muscular.
- **Tipo:** monohidrato (sello *Creapure*).
- **Dosis:** ~0,1 g por kg de peso al día, **todos los días**. No requiere fase de carga.
- **Mitos:** no causa caída de cabello ni retención subcutánea.

### 5. L-Carnitina — ❌ Innecesaria
Tu cuerpo ya produce la suficiente. No se ha demostrado en humanos que aumente la quema de grasa.

### 6. CLA — ❌ Innecesario
Los alimentos de origen animal ya aportan lo necesario. Sin evidencia para perder grasa.

### 7. Cafeína — ✅ Muy útil
Junto con la creatina, de **mayor evidencia**. Mejora energía, enfoque y rendimiento, y es el único suplemento legal y seguro que puede ayudar (un poco) con la pérdida de grasa.
- **Dosis:** 200–400 mg, ~45 min antes de entrenar. Evítala por la tarde.

### 8. Vitamina D — ✅ Recomendable (el déficit es muy común)
Su déficit es muy frecuente por poca exposición solar. Beneficios: salud, masa muscular, fuerza, testosterona.
- **Dosis:** 2.000–4.000 UI de **D3** al día, junto a una comida con grasa. ¡Y toma sol! ☀️

### 9. Vitamina C y E — ❌ Innecesarias (con buena dieta)
Si entrenas y comes bien, no aportan beneficios al rendimiento. Dosis altas pueden ser contraproducentes.

### 10. Omega 3 — ⚠️ Situacional
Útil en **veganos, adultos mayores, déficit calórico** o si no comes pescado azul 2–4 veces por semana.
- **Dosis:** 1–2 g al día (forma de **triglicéridos**).

### 11. Pre-workout — ⚠️ Mejor cafeína sola
Suelen ser **cafeína + relleno** con dosis pequeñas y poca evidencia. La **cafeína aislada** es más eficiente.

---

## En resumen

Si tu dieta, entrenamiento y descanso están en orden, los pocos que de verdad valen la pena para la mayoría son:

- 💪 **Creatina** (monohidrato)
- ☕ **Cafeína**
- ☀️ **Vitamina D** (si hay déficit)
- 🥤 **Proteína en polvo** (por practicidad)
- 🐟 **Omega 3** (según tu caso)

El resto, en la mayoría de los casos, es **gastar dinero**. Primero la base; luego piensa en suplementos.

*Resumen basado en la "Guía Completa sobre Suplementos Alimenticios" de Daniel Duque, con fines educativos.*
  $guia$,
  'Claudia Bittner',
  true,
  'es'
)
on conflict (slug) do update
  set title = excluded.title, excerpt = excluded.excerpt, cover_image = excluded.cover_image,
      content = excluded.content, published = excluded.published, lang = excluded.lang, updated_at = now();

-- 3) English version --------------------------------------------------------
insert into posts (slug, title, excerpt, cover_image, content, author, published, lang)
values (
  'supplements-guide',
  'Supplement Guide: What''s Worth It and What''s Not (Backed by Science)',
  'Only ~10% of supplements are worth it. This evidence-based guide tells you where to spend your money — and where not to.',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Protein_shake.jpg',
  $guen$
Most supplements sold today are **not magic**. In fact, only about **10% are worth it**, and none will work if the foundation — your **diet** and **training** — isn't in place.

> Before thinking about supplements, get everything else in order. Nutrition and training give you over **80% of your results**. Supplements are the cherry on top, not the cake.

## The order of priorities

1. Calories, macros & micronutrients
2. Training
3. Tracking results
4. Meal timing & frequency
5. **Supplements** ← last place

## 3 factors that make a supplement work

- **Time:** many work by accumulation — be consistent, don't expect results in days.
- **Amount:** the right dose is often individual. More isn't always better.
- **Timing:** some perform better at specific moments.

When buying, look for **quality seals** (e.g. *Creapure* for creatine).

---

## The supplements, one by one

### 1. Protein powder (Whey) — ✅ Useful (practical, not magic)
It's just **whey protein** — the same protein you get from meat, chicken, eggs or fish, only more convenient. It won't build muscle or burn fat on its own.
- **Types:** *concentrate* (cheapest), *isolate* (less fat/lactose), *hydrolyzed* (easiest to digest).
- **Dose:** 20–40 g before or after training; no daily limit if you're healthy.
- No cycling, no "rebound." What matters is **hitting your daily protein target**.

### 2. Mass Gainer — ⚠️ Situational
Doesn't build muscle; it just adds **lots of calories** for those who struggle to hit their targets during a bulk. Unnecessary if you already reach your calories with food.

### 3. BCAAs / Amino acids — ⚠️ Only in specific cases
If you eat a diet **high in animal protein**, they're a waste. They can help **vegans** or plant-protein diets (min ~4 g, taken with other protein).

### 4. Creatine — ✅✅ The most proven and safe
One of the most **scientifically backed** supplements.
- Improves strength, power and performance; helps build and preserve muscle.
- **Type:** monohydrate (look for *Creapure*).
- **Dose:** ~0.1 g per kg of bodyweight daily, **every day**. No loading phase needed.
- **Myths:** it does not cause hair loss or under-the-skin water retention.

### 5. L-Carnitine — ❌ Unnecessary
Your body already makes enough. No human evidence that it increases fat burning.

### 6. CLA — ❌ Unnecessary
Animal foods already provide enough. No evidence it helps with fat loss.

### 7. Caffeine — ✅ Very useful
Along with creatine, the **best-evidenced**. Improves energy, focus and performance, and it's the only legal, safe supplement that can (slightly) help with fat loss.
- **Dose:** 200–400 mg, ~45 min before training. Avoid it in the afternoon.

### 8. Vitamin D — ✅ Recommended (deficiency is very common)
Deficiency is widespread due to low sun exposure. Benefits: health, muscle, strength, testosterone.
- **Dose:** 2,000–4,000 IU of **D3** daily, with a meal containing fat. And get some sun! ☀️

### 9. Vitamin C & E — ❌ Unnecessary (with a good diet)
If you train and eat well, they don't boost performance. High doses can be counterproductive.

### 10. Omega 3 — ⚠️ Situational
Useful for **vegans, older adults, a calorie deficit**, or if you don't eat fatty fish 2–4 times a week.
- **Dose:** 1–2 g daily (**triglyceride** form).

### 11. Pre-workout — ⚠️ Plain caffeine is better
Usually **caffeine + filler** with small doses and weak evidence. Isolated **caffeine** is more efficient.

---

## In short

If your diet, training and sleep are in order, the few that are actually worth it for most people are:

- 💪 **Creatine** (monohydrate)
- ☕ **Caffeine**
- ☀️ **Vitamin D** (if deficient)
- 🥤 **Protein powder** (for convenience)
- 🐟 **Omega 3** (depending on your case)

The rest, in most cases, is **wasting money**. Foundation first; then think about supplements.

*Summary based on Daniel Duque's "Complete Guide to Dietary Supplements," for educational purposes.*
  $guen$,
  'Claudia Bittner',
  true,
  'en'
)
on conflict (slug) do update
  set title = excluded.title, excerpt = excluded.excerpt, cover_image = excluded.cover_image,
      content = excluded.content, published = excluded.published, lang = excluded.lang, updated_at = now();
