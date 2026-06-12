-- ─────────────────────────────────────────────────────────────
-- Blog: "Other Foods — Portion Guide" — English + Spanish, with image.
-- Run this once in the Supabase SQL editor.
-- (Requires the `lang` column from blog-post-suplementos.sql / schema.sql.)
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

> **How to read this:** each serving shown equals the listed number of starch, protein, and fat portions in your plan. A "—" means that food doesn't count toward that macro.

## Savory & Mains

| Food | Serving | Starch | Protein | Fat |
|---|---|:--:|:--:|:--:|
| Tequeños | 3 pieces | 2 | 2 | — |
| Empanada (fried) | 1 | 2 | 1 | 3 |
| Empanada (oven / air-fryer) | 1 | 2 | 1 | — |
| Pizza | 1 large slice | 2 | 2 | 1 |
| Lasagna | 200 g | 2 | 2 | 1 |
| Hot dog | 1 unit | 2 | 1 | 1 |
| Nuggets | 6 units | 1 | 3 | 1 |
| Tacos | 85–100 g | 1 | 2 | 1 |
| Processed meats* | 28 g | — | 1 | 1 |
| Tempura sushi | 12 rolls | 2.5 | 3 | 4 |
| Sushi | 12 rolls | 2.5 | 3 | 2 |
| Hamburger | 1 burger | 3 | 5 | — |
| French fries | 100 g | 1.5 | — | 3 |

*Processed meats: salami, mortadella, pepperoni, salchichón, chorizo, sausage.

> **Note:** for the hamburger, fat depends on what you add — cheese, mayo, bacon.

## Sweets & Desserts

| Food | Serving | Starch | Fat |
|---|---|:--:|:--:|
| Brownie | 5×5 cm / 30 g | 1 | 1 |
| Ice cream | ½ cup | 1 | 2 |
| Pound cake | 1 piece / 42 g | ½ | 1 |
| Oreos | 4 cookies | 2 | 1 |
| Chocolate | 30 g | 1 | 2 |
| Nutella | 1 tbsp / 15 g | ½ | ½ |

> Chocolate applies to most varieties, with or without sugar.

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

> **Cómo leer esto:** cada ración mostrada equivale al número indicado de porciones de almidón, proteína y grasa de tu plan. Un "—" significa que ese alimento no cuenta para ese macro.

## Salados y Platos Fuertes

| Alimento | Ración | Almidón | Proteína | Grasa |
|---|---|:--:|:--:|:--:|
| Tequeños | 3 piezas | 2 | 2 | — |
| Empanada (frita) | 1 | 2 | 1 | 3 |
| Empanada (horno / air-fryer) | 1 | 2 | 1 | — |
| Pizza | 1 rebanada grande | 2 | 2 | 1 |
| Lasaña | 200 g | 2 | 2 | 1 |
| Hot dog | 1 unidad | 2 | 1 | 1 |
| Nuggets | 6 unidades | 1 | 3 | 1 |
| Tacos | 85–100 g | 1 | 2 | 1 |
| Embutidos* | 28 g | — | 1 | 1 |
| Sushi tempura | 12 rollos | 2.5 | 3 | 4 |
| Sushi | 12 rollos | 2.5 | 3 | 2 |
| Hamburguesa | 1 hamburguesa | 3 | 5 | — |
| Papas fritas | 100 g | 1.5 | — | 3 |

*Embutidos: salami, mortadela, pepperoni, salchichón, chorizo, salchicha.

> **Nota:** en la hamburguesa, la grasa depende de lo que le agregues — queso, mayonesa, tocino.

## Dulces y Postres

| Alimento | Ración | Almidón | Grasa |
|---|---|:--:|:--:|
| Brownie | 5×5 cm / 30 g | 1 | 1 |
| Helado | ½ taza | 1 | 2 |
| Ponqué / panqué | 1 porción / 42 g | ½ | 1 |
| Oreos | 4 galletas | 2 | 1 |
| Chocolate | 30 g | 1 | 2 |
| Nutella | 1 cda / 15 g | ½ | ½ |

> El chocolate aplica para la mayoría de variedades, con o sin azúcar.

*Referencia basada en la guía de porciones de Duque Fit Nutrition.*
  $es$,
  'Claudia Bittner',
  true,
  'es'
)
on conflict (slug) do update
  set title = excluded.title, excerpt = excluded.excerpt, cover_image = excluded.cover_image,
      content = excluded.content, published = excluded.published, lang = excluded.lang, updated_at = now();
