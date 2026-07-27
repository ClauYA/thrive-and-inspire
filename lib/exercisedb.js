// Fuzzy matching helpers for finding an ExerciseDB exercise from our own
// (differently-worded) exercise name. ExerciseDB's /exercises/name/{q} does a
// substring match, so we try broad→narrow queries and rank the results by how
// many words they share with the target name. Pure functions (no network) so
// they can be unit-tested.

const EQUIP = new Set([
  "barbell", "dumbbell", "cable", "machine", "smith", "lever", "leverage",
  "band", "kettlebell", "bodyweight", "weighted", "ez", "trap", "sled",
]);

export function edbTokens(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")      // drop "(slow eccentric)" etc.
    .replace(/[^a-z0-9]+/g, " ")   // punctuation → space
    .trim()
    .split(" ")
    .filter(Boolean);
}

// Ordered, de-duped ExerciseDB search queries, broad → narrow:
//   full name → without equipment words → last two movement words → last word.
export function edbQueries(name) {
  const t = edbTokens(name);
  const core = t.filter((w) => !EQUIP.has(w));
  const list = [t.join(" "), core.join(" "), core.slice(-2).join(" "), core.slice(-1).join(" ")];
  return [...new Set(list.filter(Boolean))];
}

// Among candidate exercises, pick the one whose name shares the most tokens
// with the target name. Falls back to the first candidate when nothing overlaps.
export function bestByOverlap(name, candidates) {
  const want = edbTokens(name);
  let best = null;
  let bestScore = 0;
  for (const c of candidates || []) {
    const ct = new Set(edbTokens(c && c.name));
    let score = 0;
    for (const w of want) if (ct.has(w)) score++;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best || (candidates && candidates[0]) || null;
}
