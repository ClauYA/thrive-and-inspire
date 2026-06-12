-- ─────────────────────────────────────────────────────────────
-- Blog: "Other Foods — Portion Guide" — image card per food (EN + ES).
-- Run this once in the Supabase SQL editor.
-- (Requires the `lang` column from blog-post-suplementos.sql / schema.sql.)
-- Images come from LoremFlickr by keyword — swap any src for your own photo.
-- ─────────────────────────────────────────────────────────────
alter table posts add column if not exists lang text default 'es';

-- English version ----------------------------------------------------------
insert into posts (slug, title, excerpt, cover_image, content, author, published, lang)
values (
  'portion-guide-other-foods',
  'Other Foods: A Quick Portion Guide',
  'Turn everyday meals and treats — pizza, empanadas, sushi, ice cream and more — into simple portions of starch, protein, and fat.',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Good_Food_Display_-_NCI_Visuals_Online.jpg',
  $en$
A quick reference for turning everyday meals and treats into portions of **starch**, **protein**, and **fat**.

> **How to read this:** each serving shown equals the listed number of <span class="pg-chip pg-s">Starch</span> <span class="pg-chip pg-p">Protein</span> <span class="pg-chip pg-f">Fat</span> portions in your plan.

## Savory & Mains

<div class="pg-grid">
<div class="pg-card"><img src="https://loremflickr.com/320/220/cheese,stick?lock=1" alt="Tequeños"/><div class="pg-body"><div class="pg-name">Tequeños</div><div class="pg-serving">3 pieces</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-p">2 Protein</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/empanada?lock=2" alt="Empanada"/><div class="pg-body"><div class="pg-name">Empanada</div><div class="pg-serving">1 empanada</div><div class="pg-variant">Fried</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-p">1 Protein</span><span class="pg-chip pg-f">3 Fat</span><div class="pg-variant">Oven / Air-fryer</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-p">1 Protein</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/pizza?lock=3" alt="Pizza"/><div class="pg-body"><div class="pg-name">Pizza</div><div class="pg-serving">1 large slice</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-p">2 Protein</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/lasagna?lock=4" alt="Lasagna"/><div class="pg-body"><div class="pg-name">Lasagna</div><div class="pg-serving">200 g</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-p">2 Protein</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/hotdog?lock=5" alt="Hot dog"/><div class="pg-body"><div class="pg-name">Hot Dog</div><div class="pg-serving">1 unit</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-p">1 Protein</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/chicken,nuggets?lock=6" alt="Nuggets"/><div class="pg-body"><div class="pg-name">Nuggets</div><div class="pg-serving">6 units</div><span class="pg-chip pg-s">1 Starch</span><span class="pg-chip pg-p">3 Protein</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/tacos?lock=7" alt="Tacos"/><div class="pg-body"><div class="pg-name">Tacos</div><div class="pg-serving">85–100 g</div><span class="pg-chip pg-s">1 Starch</span><span class="pg-chip pg-p">2 Protein</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/salami?lock=8" alt="Processed meats"/><div class="pg-body"><div class="pg-name">Processed Meats</div><div class="pg-serving">28 g · salami, pepperoni, chorizo…</div><span class="pg-chip pg-p">1 Protein</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/sushi,tempura?lock=9" alt="Tempura sushi"/><div class="pg-body"><div class="pg-name">Tempura Sushi</div><div class="pg-serving">12 rolls</div><span class="pg-chip pg-s">2.5 Starch</span><span class="pg-chip pg-p">3 Protein</span><span class="pg-chip pg-f">4 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/sushi?lock=10" alt="Sushi"/><div class="pg-body"><div class="pg-name">Sushi</div><div class="pg-serving">12 rolls</div><span class="pg-chip pg-s">2.5 Starch</span><span class="pg-chip pg-p">3 Protein</span><span class="pg-chip pg-f">2 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/hamburger?lock=11" alt="Hamburger"/><div class="pg-body"><div class="pg-name">Hamburger</div><div class="pg-serving">1 burger · fat depends on extras</div><span class="pg-chip pg-s">3 Starch</span><span class="pg-chip pg-p">5 Protein</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/french,fries?lock=12" alt="French fries"/><div class="pg-body"><div class="pg-name">French Fries</div><div class="pg-serving">100 g</div><span class="pg-chip pg-s">1.5 Starch</span><span class="pg-chip pg-f">3 Fat</span></div></div>
</div>

## Sweets & Desserts

<div class="pg-grid">
<div class="pg-card"><img src="https://loremflickr.com/320/220/brownie?lock=13" alt="Brownie"/><div class="pg-body"><div class="pg-name">Brownie</div><div class="pg-serving">5×5 cm / 30 g</div><span class="pg-chip pg-s">1 Starch</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/ice,cream?lock=14" alt="Ice cream"/><div class="pg-body"><div class="pg-name">Ice Cream</div><div class="pg-serving">½ cup</div><span class="pg-chip pg-s">1 Starch</span><span class="pg-chip pg-f">2 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/cake?lock=15" alt="Pound cake"/><div class="pg-body"><div class="pg-name">Pound Cake</div><div class="pg-serving">1 piece / 42 g</div><span class="pg-chip pg-s">½ Starch</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/oreo?lock=16" alt="Oreos"/><div class="pg-body"><div class="pg-name">Oreos</div><div class="pg-serving">4 cookies</div><span class="pg-chip pg-s">2 Starch</span><span class="pg-chip pg-f">1 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/chocolate?lock=17" alt="Chocolate"/><div class="pg-body"><div class="pg-name">Chocolate</div><div class="pg-serving">30 g · with or without sugar</div><span class="pg-chip pg-s">1 Starch</span><span class="pg-chip pg-f">2 Fat</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/nutella?lock=18" alt="Nutella"/><div class="pg-body"><div class="pg-name">Nutella</div><div class="pg-serving">1 tbsp / 15 g</div><span class="pg-chip pg-s">½ Starch</span><span class="pg-chip pg-f">½ Fat</span></div></div>
</div>

*Reference based on Duque Fit Nutrition's portion guide.*
  $en$,
  'Claudia Bittner',
  true,
  'en'
)
on conflict (slug) do update
  set title = excluded.title, excerpt = excluded.excerpt, cover_image = excluded.cover_image,
      content = excluded.content, published = excluded.published, lang = excluded.lang, updated_at = now();

-- Spanish version ----------------------------------------------------------
insert into posts (slug, title, excerpt, cover_image, content, author, published, lang)
values (
  'guia-porciones-otros-alimentos',
  'Otros Alimentos: Guía Rápida de Porciones',
  'Convierte comidas y antojos del día a día — pizza, empanadas, sushi, helado y más — en porciones simples de almidón, proteína y grasa.',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Good_Food_Display_-_NCI_Visuals_Online.jpg',
  $es$
Una referencia rápida para convertir comidas y antojos del día a día en porciones de **almidón**, **proteína** y **grasa**.

> **Cómo leer esto:** cada ración mostrada equivale al número indicado de porciones de <span class="pg-chip pg-s">Almidón</span> <span class="pg-chip pg-p">Proteína</span> <span class="pg-chip pg-f">Grasa</span> de tu plan.

## Salados y Platos Fuertes

<div class="pg-grid">
<div class="pg-card"><img src="https://loremflickr.com/320/220/cheese,stick?lock=1" alt="Tequeños"/><div class="pg-body"><div class="pg-name">Tequeños</div><div class="pg-serving">3 piezas</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-p">2 Proteína</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/empanada?lock=2" alt="Empanada"/><div class="pg-body"><div class="pg-name">Empanada</div><div class="pg-serving">1 empanada</div><div class="pg-variant">Frita</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-p">1 Proteína</span><span class="pg-chip pg-f">3 Grasa</span><div class="pg-variant">Horno / Air-fryer</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-p">1 Proteína</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/pizza?lock=3" alt="Pizza"/><div class="pg-body"><div class="pg-name">Pizza</div><div class="pg-serving">1 rebanada grande</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-p">2 Proteína</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/lasagna?lock=4" alt="Lasaña"/><div class="pg-body"><div class="pg-name">Lasaña</div><div class="pg-serving">200 g</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-p">2 Proteína</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/hotdog?lock=5" alt="Hot dog"/><div class="pg-body"><div class="pg-name">Hot Dog</div><div class="pg-serving">1 unidad</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-p">1 Proteína</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/chicken,nuggets?lock=6" alt="Nuggets"/><div class="pg-body"><div class="pg-name">Nuggets</div><div class="pg-serving">6 unidades</div><span class="pg-chip pg-s">1 Almidón</span><span class="pg-chip pg-p">3 Proteína</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/tacos?lock=7" alt="Tacos"/><div class="pg-body"><div class="pg-name">Tacos</div><div class="pg-serving">85–100 g</div><span class="pg-chip pg-s">1 Almidón</span><span class="pg-chip pg-p">2 Proteína</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/salami?lock=8" alt="Embutidos"/><div class="pg-body"><div class="pg-name">Embutidos</div><div class="pg-serving">28 g · salami, pepperoni, chorizo…</div><span class="pg-chip pg-p">1 Proteína</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/sushi,tempura?lock=9" alt="Sushi tempura"/><div class="pg-body"><div class="pg-name">Sushi Tempura</div><div class="pg-serving">12 rollos</div><span class="pg-chip pg-s">2.5 Almidón</span><span class="pg-chip pg-p">3 Proteína</span><span class="pg-chip pg-f">4 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/sushi?lock=10" alt="Sushi"/><div class="pg-body"><div class="pg-name">Sushi</div><div class="pg-serving">12 rollos</div><span class="pg-chip pg-s">2.5 Almidón</span><span class="pg-chip pg-p">3 Proteína</span><span class="pg-chip pg-f">2 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/hamburger?lock=11" alt="Hamburguesa"/><div class="pg-body"><div class="pg-name">Hamburguesa</div><div class="pg-serving">1 hamburguesa · la grasa depende de los extras</div><span class="pg-chip pg-s">3 Almidón</span><span class="pg-chip pg-p">5 Proteína</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/french,fries?lock=12" alt="Papas fritas"/><div class="pg-body"><div class="pg-name">Papas Fritas</div><div class="pg-serving">100 g</div><span class="pg-chip pg-s">1.5 Almidón</span><span class="pg-chip pg-f">3 Grasa</span></div></div>
</div>

## Dulces y Postres

<div class="pg-grid">
<div class="pg-card"><img src="https://loremflickr.com/320/220/brownie?lock=13" alt="Brownie"/><div class="pg-body"><div class="pg-name">Brownie</div><div class="pg-serving">5×5 cm / 30 g</div><span class="pg-chip pg-s">1 Almidón</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/ice,cream?lock=14" alt="Helado"/><div class="pg-body"><div class="pg-name">Helado</div><div class="pg-serving">½ taza</div><span class="pg-chip pg-s">1 Almidón</span><span class="pg-chip pg-f">2 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/cake?lock=15" alt="Ponqué"/><div class="pg-body"><div class="pg-name">Ponqué / Panqué</div><div class="pg-serving">1 porción / 42 g</div><span class="pg-chip pg-s">½ Almidón</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/oreo?lock=16" alt="Oreos"/><div class="pg-body"><div class="pg-name">Oreos</div><div class="pg-serving">4 galletas</div><span class="pg-chip pg-s">2 Almidón</span><span class="pg-chip pg-f">1 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/chocolate?lock=17" alt="Chocolate"/><div class="pg-body"><div class="pg-name">Chocolate</div><div class="pg-serving">30 g · con o sin azúcar</div><span class="pg-chip pg-s">1 Almidón</span><span class="pg-chip pg-f">2 Grasa</span></div></div>
<div class="pg-card"><img src="https://loremflickr.com/320/220/nutella?lock=18" alt="Nutella"/><div class="pg-body"><div class="pg-name">Nutella</div><div class="pg-serving">1 cda / 15 g</div><span class="pg-chip pg-s">½ Almidón</span><span class="pg-chip pg-f">½ Grasa</span></div></div>
</div>

*Referencia basada en la guía de porciones de Duque Fit Nutrition.*
  $es$,
  'Claudia Bittner',
  true,
  'es'
)
on conflict (slug) do update
  set title = excluded.title, excerpt = excluded.excerpt, cover_image = excluded.cover_image,
      content = excluded.content, published = excluded.published, lang = excluded.lang, updated_at = now();
