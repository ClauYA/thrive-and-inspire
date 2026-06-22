// Canonical RIR ladder, shared by the logger and the plan editor so both
// offer the same options: muscular failure, then 0, 0-1, 1, 1-2, 2 … up.
export const RIR_OPTIONS = ["fallo", "0", "0-1", "1", "1-2", "2", "2-3", "3", "3-4", "4"];

// Display label: "fallo" → localized "failure"; ranges use an en-dash.
export const rirLabel = (o, failureText) =>
  o === "fallo" ? failureText : String(o).replace("-", "–");
