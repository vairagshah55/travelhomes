import { describe, it, expect } from "vitest";

import compliance from "../vehicleCompliance.js";

const {
  evaluateCompliance,
  daysUntil,
  expiredBefore,
  expiringBefore,
  reminderThresholdFor,
  listLabels,
  toDateKey,
} = compliance;

/** Midday UTC on the reference day, so the IST shift never lands on a boundary. */
const NOW = new Date("2026-08-30T12:00:00Z");
/** A stored expiry, the way Mongo holds a date-only value. */
const on = (iso) => new Date(`${iso}T00:00:00Z`);

describe("daysUntil", () => {
  it("counts a document expiring today as having zero days left, not as expired", () => {
    // The whole reason the comparison is day-indexed: `new Date()` would make a
    // policy lapse at 05:30 IST on its own last valid day.
    expect(daysUntil(on("2026-08-30"), NOW)).toBe(0);
  });
  it("goes negative the day after", () => {
    expect(daysUntil(on("2026-08-29"), NOW)).toBe(-1);
  });
  it("counts forward", () => {
    expect(daysUntil(on("2026-09-29"), NOW)).toBe(30);
  });
  it("returns null for an absent date", () => {
    expect(daysUntil(null, NOW)).toBeNull();
    expect(daysUntil("", NOW)).toBeNull();
  });
  it("returns null for an unparseable value", () => {
    expect(daysUntil("not-a-date", NOW)).toBeNull();
  });

  it("still reports today as valid late in the Indian evening", () => {
    // 23:00 IST on the 30th is 17:30 UTC on the 30th — the same day either way.
    expect(daysUntil(on("2026-08-30"), new Date("2026-08-30T17:30:00Z"))).toBe(0);
  });
  it("expires it once IST has rolled into the next day but UTC has not", () => {
    // 00:30 IST on the 31st is 19:00 UTC on the 30th. Judged in IST, the 30th
    // is over and the policy has lapsed.
    expect(daysUntil(on("2026-08-30"), new Date("2026-08-30T19:00:00Z"))).toBe(-1);
  });
});

describe("evaluateCompliance", () => {
  it("reports ok when both documents are comfortably in date", () => {
    const v = evaluateCompliance(
      { insuranceExpiry: on("2027-06-01"), pucExpiry: on("2027-01-01") },
      NOW,
    );
    expect(v.state).toBe("ok");
    expect(v.expired).toHaveLength(0);
    expect(v.expiring).toHaveLength(0);
  });

  it("condemns the listing when ONLY the PUC has expired", () => {
    // The business rule the feature exists for: either document alone is enough.
    const v = evaluateCompliance(
      { insuranceExpiry: on("2027-06-01"), pucExpiry: on("2026-08-29") },
      NOW,
    );
    expect(v.state).toBe("expired");
    expect(v.expired.map((d) => d.key)).toEqual(["puc"]);
  });

  it("condemns the listing when ONLY the insurance has expired", () => {
    const v = evaluateCompliance(
      { insuranceExpiry: on("2026-08-01"), pucExpiry: on("2027-01-01") },
      NOW,
    );
    expect(v.state).toBe("expired");
    expect(v.expired.map((d) => d.key)).toEqual(["insurance"]);
  });

  it("reports both when both have lapsed", () => {
    const v = evaluateCompliance(
      { insuranceExpiry: on("2026-08-01"), pucExpiry: on("2026-08-29") },
      NOW,
    );
    expect(v.expired.map((d) => d.key)).toEqual(["insurance", "puc"]);
  });

  it("prefers 'expired' over 'expiring' when one of each is present", () => {
    const v = evaluateCompliance(
      { insuranceExpiry: on("2026-09-05"), pucExpiry: on("2026-08-01") },
      NOW,
    );
    expect(v.state).toBe("expired");
    expect(v.expiring.map((d) => d.key)).toEqual(["insurance"]);
  });

  it("treats the last valid day as expiring, not expired", () => {
    const v = evaluateCompliance({ insuranceExpiry: on("2026-08-30") }, NOW);
    expect(v.state).toBe("expiring");
    expect(v.docs[0].days).toBe(0);
  });

  it("flags a missing insurance date but not a missing PUC date", () => {
    // PUC is optional at onboarding; insurance is not.
    const v = evaluateCompliance({ insuranceExpiry: null, pucExpiry: null }, NOW);
    expect(v.state).toBe("missing");
    expect(v.missing.map((d) => d.key)).toEqual(["insurance"]);
    expect(v.docs.find((d) => d.key === "puc").state).toBe("absent");
  });

  it("enforces a PUC date once one is on file", () => {
    const v = evaluateCompliance({ insuranceExpiry: on("2027-01-01"), pucExpiry: on("2026-08-29") }, NOW);
    expect(v.expired.map((d) => d.key)).toEqual(["puc"]);
  });

  it("reports the nearest expiry across both documents", () => {
    const v = evaluateCompliance(
      { insuranceExpiry: on("2027-06-01"), pucExpiry: on("2026-09-04") },
      NOW,
    );
    expect(v.soonest).toBe(5);
  });

  it("puts the 30th day inside the warning window and the 31st outside it", () => {
    expect(evaluateCompliance({ insuranceExpiry: on("2026-09-29") }, NOW).state).toBe("expiring");
    expect(evaluateCompliance({ insuranceExpiry: on("2026-09-30") }, NOW).state).toBe("ok");
  });
});

describe("query cutoffs", () => {
  it("expiredBefore matches everything strictly before today", () => {
    const cutoff = expiredBefore(NOW);
    expect(on("2026-08-29") < cutoff).toBe(true);
    // A policy expiring today must NOT be caught by the take-down query.
    expect(on("2026-08-30") < cutoff).toBe(false);
  });

  it("expiringBefore(30) includes the 30th day and excludes the 31st", () => {
    const cutoff = expiringBefore(30, NOW);
    expect(on("2026-09-29") < cutoff).toBe(true);
    expect(on("2026-09-30") < cutoff).toBe(false);
  });
});

describe("reminderThresholdFor", () => {
  it("collapses each stretch of days into one band, so one email is sent per band", () => {
    expect(reminderThresholdFor(30)).toBe(30);
    expect(reminderThresholdFor(25)).toBe(30);
    expect(reminderThresholdFor(16)).toBe(30);
    expect(reminderThresholdFor(15)).toBe(15);
    expect(reminderThresholdFor(8)).toBe(15);
    expect(reminderThresholdFor(7)).toBe(7);
    expect(reminderThresholdFor(4)).toBe(7);
    expect(reminderThresholdFor(3)).toBe(3);
    expect(reminderThresholdFor(1)).toBe(1);
    expect(reminderThresholdFor(0)).toBe(1);
  });
  it("is silent outside the window and after expiry", () => {
    expect(reminderThresholdFor(31)).toBeNull();
    expect(reminderThresholdFor(-1)).toBeNull();
    expect(reminderThresholdFor(null)).toBeNull();
  });
});

describe("formatting helpers", () => {
  it("renders a stored date as the YYYY-MM-DD a date input wants", () => {
    expect(toDateKey(on("2026-09-04"))).toBe("2026-09-04");
    expect(toDateKey(null)).toBe("");
  });
  it("joins one, two and three labels readably", () => {
    expect(listLabels([{ label: "Insurance" }])).toBe("Insurance");
    expect(listLabels([{ label: "Insurance" }, { label: "PUC certificate" }])).toBe(
      "Insurance and PUC certificate",
    );
    expect(listLabels([])).toBe("");
  });
});
