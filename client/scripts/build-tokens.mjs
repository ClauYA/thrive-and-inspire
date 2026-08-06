#!/usr/bin/env node
/**
 * build-tokens.mjs — Design token generator (Figma → CSS bridge)
 *
 * Reads the single source of truth (tokens/tokens.json, in W3C-DTCG / Tokens
 * Studio format) and regenerates the Tailwind v4 `@theme` block inside
 * src/index.css, between the /* TOKENS:START * / and /* TOKENS:END * / markers.
 *
 * Flow:  edit in Figma → export to tokens/tokens.json (Tokens Studio)
 *        → `npm run tokens` → src/index.css is rebuilt.
 *
 * Emits three tiers:
 *   1. PRIMITIVES — raw palette with honest names (--color-amber-500, ...)
 *   2. SEMANTIC   — role tokens aliased to primitives (--color-action-primary, ...)
 *   3. LEGACY     — compatibility shim so the OLD Tailwind names
 *                   (bg-terracotta, bg-forest, ...) keep working until every
 *                   component is migrated to the semantic names. Remove later.
 *
 * Run: node scripts/build-tokens.mjs   (or: npm run tokens)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TOKENS_PATH = path.join(ROOT, "tokens", "tokens.json");
const CSS_PATH = path.join(ROOT, "src", "index.css");

// Font fallback stacks (Figma only stores the family; code wants the full stack)
const FONT_FALLBACK = { display: ", Georgia, serif", body: ", sans-serif" };

// Legacy Tailwind color name  ->  primitive CSS var it now points to.
// This shim keeps the existing 43 files working. Delete a line once the
// corresponding old utility is gone from the codebase.
// Neutral palette test (arena/salvia/slate/ink): old Tailwind names map to the new palette.
const LEGACY = {
  cream: "color-neutral-100",
  "warm-white": "color-neutral-000",
  sand: "color-neutral-300",
  terracotta: "color-forest-500",
  "terracotta-light": "color-forest-400",
  "terracotta-dark": "color-forest-700",
  forest: "color-forest-700",
  "forest-light": "color-forest-400",
  sage: "color-lime-500",
  "sage-light": "color-lime-300",
  charcoal: "color-ink-900",
  "warm-gray": "color-neutral-500",
  "light-gray": "color-neutral-400",
  gold: "color-orange-500",
};

const isRef = (v) => typeof v === "string" && v.startsWith("{") && v.endsWith("}");
const refToVar = (v) => `var(--${v.slice(1, -1).replace(/\./g, "-")})`;

function flatten(obj, prefix, out) {
  for (const [k, val] of Object.entries(obj)) {
    if (val && typeof val === "object" && "value" in val) {
      out.push([prefix ? `${prefix}.${k}` : k, val]);
    } else if (val && typeof val === "object") {
      flatten(val, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

function emit(tokenPath, tok) {
  if (tok.type === "fontFamilies") {
    // Only primitive font.* becomes a CSS var; semantic font-family.* is design-only.
    if (!tokenPath.startsWith("font.")) return null;
    const leaf = tokenPath.split(".").pop();
    return `  --font-${leaf}: "${tok.value}"${FONT_FALLBACK[leaf] || ""};`;
  }
  // color
  const cssVar = `--${tokenPath.replace(/\./g, "-")}`;
  const value = isRef(tok.value) ? refToVar(tok.value) : tok.value;
  return `  ${cssVar}: ${value};`;
}

const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
const prim = flatten(tokens.primitives || {}, "", []).map(([p, t]) => emit(p, t)).filter(Boolean);
const sem = flatten(tokens.semantic || {}, "", []).map(([p, t]) => emit(p, t)).filter(Boolean);
const legacy = Object.entries(LEGACY).map(([name, ref]) => `  --color-${name}: var(--${ref});`);

const block = `@theme {
  /* ── PRIMITIVES · raw palette (honest names) ── */
${prim.join("\n")}

  /* ── SEMANTIC · roles → primitives ── */
${sem.join("\n")}

  /* ── LEGACY · compat shim, remove as components migrate to semantic ── */
${legacy.join("\n")}
}`;

const START = "/* TOKENS:START";
const END = "TOKENS:END */";
let css = fs.readFileSync(CSS_PATH, "utf8");
const s = css.indexOf(START);
const e = css.indexOf(END);
if (s === -1 || e === -1) {
  throw new Error("Markers not found in src/index.css. Expected /* TOKENS:START */ … /* TOKENS:END */");
}
const header =
  "/* TOKENS:START – auto-generated from tokens/tokens.json via `npm run tokens`. Do not edit between these markers. */";
css = css.slice(0, s) + `${header}\n${block}\n/* ${END}` + css.slice(e + END.length);
fs.writeFileSync(CSS_PATH, css);

console.log(
  `✓ index.css tokens rebuilt — ${prim.length} primitives, ${sem.length} semantic, ${legacy.length} legacy aliases`
);
