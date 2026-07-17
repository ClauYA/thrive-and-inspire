// Session-feedback helpers, extracted so they can be unit-tested without the server.

// Normalize the optional session-feedback fields sent with a workout.
// Returns { feel: 1–10|null, effort: whitelisted string|"", muscleIntensity: JSON string }.
export function parseFeedback(body) {
  const f = Number(body.sessionFeel);
  const feel = Number.isFinite(f) && f >= 1 && f <= 10 ? Math.round(f) : null;
  const effort = ["easy", "moderate", "hard", "limit"].includes(body.sessionEffort) ? body.sessionEffort : "";
  const mi = {};
  if (body.muscleIntensity && typeof body.muscleIntensity === "object") {
    for (const [k, v] of Object.entries(body.muscleIntensity)) {
      const n = Math.round(Number(v));
      if (k && Number.isFinite(n) && n >= 1 && n <= 5) mi[String(k).slice(0, 40)] = n;
    }
  }
  return { feel, effort, muscleIntensity: JSON.stringify(mi) };
}
