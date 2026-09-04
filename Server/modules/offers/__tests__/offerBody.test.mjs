import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { upsertBody, IGNORED } = require("../offerBody.js");

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../../..");

const parse = (body) => upsertBody.parse(body);
const failure = (body) => {
  try {
    upsertBody.parse(body);
    return null;
  } catch (err) {
    return err.issues;
  }
};

describe("the offer upsert body", () => {
  it("accepts a listing the admin form would send", () => {
    const out = parse({
      name: "cabins",
      category: "wildlife-lodges",
      serviceType: "unique-stay",
      description: "A cabin",
      regularPrice: "10",
      features: ["WiFi"],
      rules: ["No smoking"],
      checkInTime: "14:00",
      checkOutTime: "11:00",
      numberOfRooms: "3",
      city: "Patan",
      state: "Gujarat",
      status: "pending",
      photos: { coverUrl: "a.jpg", galleryUrls: ["b.jpg"] },
      discounts: { firstUser: { enabled: true, type: "percentage", value: "10" } },
      rooms: [{ id: "1", guestCapacity: 2 }],
    });
    expect(out.checkInTime).toBe("14:00");
    // Numbers arrive from the form as strings and are coerced, not rejected.
    expect(out.regularPrice).toBe(10);
    expect(out.numberOfRooms).toBe(3);
  });

  it("accepts a vehicle rental's whole rate card", () => {
    const out = parse({
      serviceType: "vehicle-rental",
      vehicleClass: "car",
      fuelType: "Petrol",
      transmission: "Automatic",
      fuelPolicy: "same-to-same",
      tollsAndParking: "on-actuals",
      airConditioned: true,
      selfDriveEnabled: true,
      selfDrivePerDay: "2500",
      withDriverOneWay: false,
      withDriverTwoWay: true,
      securityDeposit: "5000",
      pickupPoints: ["Depot"],
    });
    expect(out.fuelPolicy).toBe("same-to-same");
    expect(out.selfDrivePerDay).toBe(2500);
  });

  /* The bug this schema exists for. A key the model cannot store used to be
     dropped by Mongoose after a 200 — the check-in/check-out incident on
     2026-09-03 lost a live submission that way. Now it names the key. */
  it("rejects a key the model cannot store, and says which", () => {
    const issues = failure({ name: "cabins", checkinTime: "14:00" });
    expect(issues).not.toBeNull();
    expect(JSON.stringify(issues)).toContain("checkinTime");
  });

  /* Mongoose rejects the WHOLE update on a bad enum, so one wrong value would
     otherwise lose every other edit in the same save. */
  it("rejects a bad enum value by name", () => {
    expect(failure({ fuelPolicy: "sometimes" })?.[0].path).toEqual(["fuelPolicy"]);
    expect(failure({ vehicleClass: "spaceship" })?.[0].path).toEqual(["vehicleClass"]);
    expect(failure({ status: "almost" })?.[0].path).toEqual(["status"]);
  });

  it("folds finalPrice onto the path the model actually has", () => {
    const out = parse({ finalPrice: 800 });
    expect(out.discountPrice).toBe(800);
    expect("finalPrice" in out).toBe(false);
  });

  it("lets the real path win when a client sends both", () => {
    expect(parse({ finalPrice: 800, discountPrice: 900 }).discountPrice).toBe(900);
  });

  /* Twelve flat discount keys the vendor create payload has sent since the
     structured sub-document replaced them. Never stored, so dropping them
     changes nothing — but 400ing a vendor mid-submit over them would. */
  it("swallows the dead legacy discount keys instead of rejecting them", () => {
    const body = Object.fromEntries([...IGNORED].map((k) => [k, "whatever"]));
    const out = parse({ ...body, name: "x" });
    expect(Object.keys(out)).toEqual(["name"]);
    expect(IGNORED.size).toBe(12);
  });

  it("keeps an explicit null, because that is how a field gets cleared", () => {
    const out = parse({ securityDeposit: null, fuelPolicy: null });
    expect(out.securityDeposit).toBeNull();
    expect(out.fuelPolicy).toBeNull();
  });

  it("drops keys the client did not send rather than sending undefined", () => {
    expect(Object.keys(parse({ name: "x" }))).toEqual(["name"]);
  });

  /* Only the top level is strict. An unknown key inside `photos` is stripped,
     because sub-document shapes drift for harmless reasons and a 400 there
     would block a save over something nobody reads. */
  it("strips an unknown nested key without failing the request", () => {
    const out = parse({ photos: { coverUrl: "a.jpg", legacyThumb: "t.jpg" } });
    expect(out.photos).toEqual({ coverUrl: "a.jpg" });
  });
});

/**
 * Cross-package guard.
 *
 * The frontend field registry and the Mongoose model are in different packages
 * with no shared build step, which is exactly how the check-in/check-out fields
 * shipped 48 minutes apart. Reading the registry's source here is crude, but it
 * is the only thing that fails the build when a form grows a field the server
 * cannot store.
 */
describe("frontend registry ↔ Offer schema parity", () => {
  const registry = readFileSync(
    path.join(REPO, "apps/web/src/lib/offeringFields.ts"),
    "utf8",
  );
  const sections = registry.slice(
    registry.indexOf("export const SECTIONS"),
    registry.indexOf("export const DISCOUNT_SLOTS"),
  );
  const names = [...new Set([...sections.matchAll(/\bname: "(\w+)"/g)].map((m) => m[1]))];

  it("read the registry (a broken parse must fail loudly, not vacuously)", () => {
    expect(names.length).toBeGreaterThan(60);
    expect(names).toContain("checkInTime");
    expect(names).toContain("fuelPolicy");
  });

  it("accepts every field the forms can edit", () => {
    const rejected = names.filter((n) => failure({ [n]: null }) !== null);
    expect(rejected).toEqual([]);
  });
});
