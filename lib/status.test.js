import { describe, it, expect } from "vitest";
import { normalizeStatus, isApproved, USER_STATUSES } from "./status.js";

describe("user status", () => {
  it("lists the known statuses", () => {
    expect(USER_STATUSES).toEqual(["approved", "pending", "rejected"]);
  });

  it("normalizes known values and defaults unknown to pending", () => {
    expect(normalizeStatus("approved")).toBe("approved");
    expect(normalizeStatus("rejected")).toBe("rejected");
    expect(normalizeStatus("weird")).toBe("pending");
    expect(normalizeStatus(null)).toBe("pending");
    expect(normalizeStatus(undefined)).toBe("pending");
  });

  it("isApproved is true only for 'approved'", () => {
    expect(isApproved("approved")).toBe(true);
    expect(isApproved("pending")).toBe(false);
    expect(isApproved("rejected")).toBe(false);
    expect(isApproved(undefined)).toBe(false);
  });
});
