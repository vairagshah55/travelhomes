import { describe, it, expect } from "vitest";

import {
  complianceHeadline,
  daysUntilExpiry,
  describeDays,
  evaluateCompliance,
  toDateInputValue,
  todayDateInputValue,
} from "./vehicleCompliance";

/**
 * These mirror Server/shared/__tests__/vehicleCompliance.test.mjs case for case.
 * The two implementations are deliberate duplicates — the server acts on the
 * verdict and the consoles display it — so the cases are duplicated too. A
 * change that makes a badge disagree with the site fails here.
 */

const NOW = new Date("2026-08-30T12:00:00Z");
const on = (iso: string) => `${iso}T00:00:00Z`;
const vehicle = (insurance: string | null, puc: string | null = null) => ({
  serviceType: "vehicle-rental",
  insuranceExpiry: insurance,
  pucExpiry: puc,
});

describe("daysUntilExpiry", () => {
  it("counts a document expiring today as having zero days left", () => {
    expect(daysUntilExpiry(on("2026-08-30"), NOW)).toBe(0);
  });
  it("goes negative the day after", () => {
    expect(daysUntilExpiry(on("2026-08-29"), NOW)).toBe(-1);
  });
  it("returns null for an absent or unparseable date", () => {
    expect(daysUntilExpiry(null, NOW)).toBeNull();
    expect(daysUntilExpiry("nonsense", NOW)).toBeNull();
  });
  it("judges the day in IST, not UTC", () => {
    // 00:30 IST on the 31st is 19:00 UTC on the 30th.
    expect(daysUntilExpiry(on("2026-08-30"), new Date("2026-08-30T19:00:00Z"))).toBe(-1);
  });
});

describe("evaluateCompliance", () => {
  it("returns null for anything that is not a vehicle rental", () => {
    expect(evaluateCompliance({ serviceType: "camper-van" }, NOW)).toBeNull();
    expect(evaluateCompliance(null, NOW)).toBeNull();
  });

  it("condemns the listing when only the PUC has expired", () => {
    const v = evaluateCompliance(vehicle(on("2027-06-01"), on("2026-08-29")), NOW)!;
    expect(v.state).toBe("expired");
    expect(v.expired.map((d) => d.key)).toEqual(["puc"]);
  });

  it("condemns the listing when only the insurance has expired", () => {
    const v = evaluateCompliance(vehicle(on("2026-08-01"), on("2027-01-01")), NOW)!;
    expect(v.state).toBe("expired");
    expect(v.expired.map((d) => d.key)).toEqual(["insurance"]);
  });

  it("prefers 'expired' over 'expiring' when one of each is present", () => {
    const v = evaluateCompliance(vehicle(on("2026-09-05"), on("2026-08-01")), NOW)!;
    expect(v.state).toBe("expired");
    expect(v.expiring.map((d) => d.key)).toEqual(["insurance"]);
  });

  it("treats the last valid day as expiring, not expired", () => {
    const v = evaluateCompliance(vehicle(on("2026-08-30")), NOW)!;
    expect(v.state).toBe("expiring");
    expect(v.docs[0].days).toBe(0);
  });

  it("flags a missing insurance date but not a missing PUC date", () => {
    const v = evaluateCompliance(vehicle(null, null), NOW)!;
    expect(v.state).toBe("missing");
    expect(v.missing.map((d) => d.key)).toEqual(["insurance"]);
    expect(v.docs.find((d) => d.key === "puc")!.state).toBe("absent");
  });

  it("puts the 30th day inside the warning window and the 31st outside it", () => {
    expect(evaluateCompliance(vehicle(on("2026-09-29")), NOW)!.state).toBe("expiring");
    expect(evaluateCompliance(vehicle(on("2026-09-30")), NOW)!.state).toBe("ok");
  });

  it("reads the hold flag the sweep writes", () => {
    const held = evaluateCompliance(
      { ...vehicle(on("2026-08-01")), complianceHold: { active: true } },
      NOW,
    )!;
    expect(held.onHold).toBe(true);
    expect(evaluateCompliance(vehicle(on("2026-08-01")), NOW)!.onHold).toBe(false);
  });

  it("seeds the renewal form with a date input value", () => {
    const v = evaluateCompliance(vehicle(on("2027-03-14")), NOW)!;
    expect(v.docs[0].dateKey).toBe("2027-03-14");
    expect(v.docs[1].dateKey).toBe("");
  });
});

describe("copy helpers", () => {
  it("describes the days remaining in the tense a vendor reads", () => {
    expect(describeDays(0)).toBe("expires today");
    expect(describeDays(1)).toBe("1 day left");
    expect(describeDays(12)).toBe("12 days left");
    expect(describeDays(-1)).toBe("expired 1 day ago");
    expect(describeDays(-9)).toBe("expired 9 days ago");
    expect(describeDays(null)).toBe("not provided");
  });

  it("names the document that took the listing down", () => {
    const v = evaluateCompliance(vehicle(on("2027-06-01"), on("2026-08-01")), NOW)!;
    expect(complianceHeadline(v)).toContain("PUC certificate");
    expect(complianceHeadline(v)).toContain("off the site");
  });

  it("pluralises the verb when both documents lapsed", () => {
    const v = evaluateCompliance(vehicle(on("2026-08-01"), on("2026-08-02")), NOW)!;
    expect(complianceHeadline(v)).toContain("Insurance and PUC certificate have expired");
  });
});

describe("date input helpers", () => {
  it("renders a stored date as YYYY-MM-DD", () => {
    expect(toDateInputValue(on("2026-09-04"))).toBe("2026-09-04");
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue("nonsense")).toBe("");
  });
  it("offers today as the minimum selectable date, in IST", () => {
    expect(todayDateInputValue(NOW)).toBe("2026-08-30");
    // 00:30 IST on the 31st — the picker must already be offering the 31st.
    expect(todayDateInputValue(new Date("2026-08-30T19:00:00Z"))).toBe("2026-08-31");
  });
});
