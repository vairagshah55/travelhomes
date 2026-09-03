import { describe, it, expect } from "vitest";

import { formatTimeOfDay, isValidTimeOfDay } from "./formateTime";

/**
 * Property check-in / check-out are stored as a bare 24-hour `"HH:mm"` string
 * and displayed 12-hour. The formatter is what the stay onboarding validation
 * and the admin approval drawer both go through, so the edges are pinned here:
 * midnight and noon are the ones that break naive `% 12` arithmetic, and a
 * clock time must never be routed through the Date-based formatters in this
 * module (`new Date("14:00")` is Invalid Date).
 */

describe("formatTimeOfDay", () => {
  it("renders the values this feature was specified with", () => {
    expect(formatTimeOfDay("14:00")).toBe("2:00 PM");
    expect(formatTimeOfDay("11:00")).toBe("11:00 AM");
  });

  it("gets midnight and noon right", () => {
    // `12 % 12` is 0, which naive code renders as "0:00".
    expect(formatTimeOfDay("00:00")).toBe("12:00 AM");
    expect(formatTimeOfDay("12:00")).toBe("12:00 PM");
    expect(formatTimeOfDay("00:30")).toBe("12:30 AM");
    expect(formatTimeOfDay("12:30")).toBe("12:30 PM");
  });

  it("keeps the AM/PM boundary on the right side", () => {
    expect(formatTimeOfDay("11:59")).toBe("11:59 AM");
    expect(formatTimeOfDay("13:01")).toBe("1:01 PM");
    expect(formatTimeOfDay("23:59")).toBe("11:59 PM");
  });

  it("pads minutes but not the hour", () => {
    expect(formatTimeOfDay("09:05")).toBe("9:05 AM");
    expect(formatTimeOfDay("9:05")).toBe("9:05 AM");
  });

  it("tolerates surrounding whitespace", () => {
    expect(formatTimeOfDay("  14:00  ")).toBe("2:00 PM");
  });

  it("returns a dash for anything that is not a clock time", () => {
    expect(formatTimeOfDay("")).toBe("-");
    expect(formatTimeOfDay(null)).toBe("-");
    expect(formatTimeOfDay(undefined)).toBe("-");
    expect(formatTimeOfDay("2pm")).toBe("-");
    expect(formatTimeOfDay("14")).toBe("-");
    expect(formatTimeOfDay("14:00:00")).toBe("-");
    expect(formatTimeOfDay("2026-09-04T14:00:00Z")).toBe("-");
  });

  it("rejects out-of-range hours and minutes", () => {
    expect(formatTimeOfDay("24:00")).toBe("-");
    expect(formatTimeOfDay("25:30")).toBe("-");
    expect(formatTimeOfDay("12:60")).toBe("-");
    expect(formatTimeOfDay("12:99")).toBe("-");
  });
});

describe("isValidTimeOfDay", () => {
  it("accepts the times the picker can produce", () => {
    for (const t of ["00:00", "09:05", "12:00", "14:00", "23:59"]) {
      expect(isValidTimeOfDay(t)).toBe(true);
    }
  });

  it("rejects empty and malformed values — this is what gates the step", () => {
    for (const t of ["", "   ", "2pm", "14", "24:00", "12:60"]) {
      expect(isValidTimeOfDay(t)).toBe(false);
    }
    expect(isValidTimeOfDay(null)).toBe(false);
    expect(isValidTimeOfDay(undefined)).toBe(false);
  });
});
