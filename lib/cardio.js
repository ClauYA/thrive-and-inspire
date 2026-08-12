// Cardio helpers, extracted so they can be unit-tested without the server.

const CARDIO_TYPES = ["walk", "bike", "row", "stair", "ellip", "incline", "hiit", "rope"];

// Normalize the optional cardio object sent with a workout.
// Returns a JSON string of { type, duration, distance, pulse, rpe, notes } or null.
export function parseCardio(body) {
  const c = body && typeof body.cardio === "object" ? body.cardio : null;
  if (!c) return null;
  const str = (v, n) => (v == null ? "" : String(v).slice(0, n));
  const rn = Number(c.rpe);
  const rpe = Number.isFinite(rn) && rn >= 1 && rn <= 10 ? Math.round(rn) : null;
  const out = {
    type: CARDIO_TYPES.includes(c.type) ? c.type : "",
    duration: str(c.duration, 20),
    distance: str(c.distance, 20),
    pulse: str(c.pulse, 20),
    rpe,
    notes: str(c.notes, 500),
  };
  if (!out.type && !out.duration && !out.distance && !out.pulse && out.rpe == null && !out.notes) return null;
  return JSON.stringify(out);
}
