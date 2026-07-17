// Plan helpers, extracted so they can be unit-tested without booting the server.

// Keep prescribed set counts sane: a whole number in 1–20, or null when unset.
// Guards against corrupted values (e.g. a stray "323") ever reaching the DB.
export function clampSets(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 20);
}
