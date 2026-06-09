// Evidence-based progressive-overload suggestion from the last session,
// using RIR (reps in reserve) + double progression.
//   - RIR >= 3  → too easy, add weight/reps
//   - RIR == 2  → push for 1-2 more reps, then add weight
//   - RIR 0-1   → near failure, hold and consolidate technique
export function recommendation(lastSets, lang = "en") {
  const es = lang === "es";
  if (!lastSets || lastSets.length === 0) {
    return { tone: "first", text: es ? "Primera vez con este ejercicio — registra tus series 💪" : "First time with this exercise — log your sets 💪" };
  }

  // Top set: heaviest weight, tie-broken by most reps.
  const top = lastSets.reduce((a, b) => {
    const wa = Number(a.weight) || 0;
    const wb = Number(b.weight) || 0;
    if (wb > wa) return b;
    if (wb === wa && (Number(b.reps) || 0) > (Number(a.reps) || 0)) return b;
    return a;
  });
  const w = Number(top.weight) || 0;
  const reps = Number(top.reps) || 0;
  const rir = top.rir == null ? null : Number(top.rir);
  const inc = w >= 20 ? 2.5 : w > 0 ? 1 : 0;

  if (rir == null) {
    return { tone: "maintain", text: es ? `Repite ${w} × ${reps} y anota tu RIR esta vez.` : `Repeat ${w} × ${reps} and log your RIR this time.` };
  }
  if (rir >= 3) {
    return {
      tone: "increase",
      text: es
        ? `Sube el peso${inc ? ` (+${inc})` : ""} o suma reps — te quedaron ${rir} en reserva.`
        : `Increase the weight${inc ? ` (+${inc})` : ""} or add reps — you left ${rir} in reserve.`,
    };
  }
  if (rir === 2) {
    return {
      tone: "push",
      text: es
        ? `Intenta 1–2 reps más con ${w}. Si llegas con RIR ≥3, sube peso la próxima.`
        : `Try 1–2 more reps at ${w}. If you reach RIR ≥3, add weight next time.`,
    };
  }
  return {
    tone: "maintain",
    text: es
      ? `Mantén ${w} × ${reps}. Estuviste cerca del fallo (RIR ${rir}); consolida la técnica.`
      : `Hold ${w} × ${reps}. You were near failure (RIR ${rir}); groove the technique.`,
  };
}

export const toneStyles = {
  first: "bg-sage-light/40 text-forest",
  increase: "bg-terracotta/15 text-terracotta-dark",
  push: "bg-gold/20 text-charcoal",
  maintain: "bg-sage/15 text-forest",
};
