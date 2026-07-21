// Member account states. Only "approved" members can log in / use the app.
//   pending  — self-registered, waiting for the coach to approve
//   approved — coach-invited or approved; full access
//   rejected — request declined / access revoked
export const USER_STATUSES = ["approved", "pending", "rejected"];

// Coerce any stored/input value to a known status (defaults to the safe "pending").
export function normalizeStatus(s) {
  return USER_STATUSES.includes(s) ? s : "pending";
}

export const isApproved = (s) => s === "approved";
