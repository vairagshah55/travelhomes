/**
 * Regression tests for who gets notified about a listing.
 *
 * The bug: `resolveVendor` decided inside its `offer.userId` branch and
 * returned from it. That branch is almost always entered, because `userId` is a
 * well-formed ObjectId — but the User row it names frequently does not exist,
 * so the function returned `{ email: null }` and never consulted the Vendor
 * record, which had the real address. Measured on production: **7 of 7 offers
 * resolved to no email**, which silently killed the vendor half of every
 * notification (booking confirmations to the vendor, and the "your listing was
 * removed for expired documents" mail).
 *
 * The precedence now lives in one pure function, so it can be pinned without a
 * database — the lookups around it are plain queries.
 */
import { describe, it, expect } from "vitest";

const { pickVendorIdentity } = (await import("../bookingNotifications.js")).default;

const OID = "6a5c9766f44a165e3fce0a37";

describe("pickVendorIdentity", () => {
  it("falls through to the Vendor record when the owning User has no email", () => {
    // The exact production shape: a userId pointing at nothing, and a Vendor
    // row carrying the address. This returned null before the fix.
    const got = pickVendorIdentity({
      ownerId: OID,
      owner: null,
      vendor: { email: "hello.travelhomes@gmail.com", personName: "Koushal" },
      offerName: "hhh",
    });
    expect(got.email).toBe("hello.travelhomes@gmail.com");
    expect(got.name).toBe("Koushal");
  });

  it("still prefers the owning User when it does have an email", () => {
    const got = pickVendorIdentity({
      ownerId: OID,
      owner: { email: "owner@example.com", name: "Owner" },
      vendor: { email: "vendor@example.com", personName: "Vendor" },
    });
    expect(got.email).toBe("owner@example.com");
    expect(got.name).toBe("Owner");
  });

  it("keeps the user id even when the address came from the Vendor record", () => {
    // The bell is addressed by id, the email by address. Losing the id would
    // trade one dead channel for another.
    const got = pickVendorIdentity({
      ownerId: OID,
      owner: null,
      vendor: { email: "v@example.com" },
    });
    expect(String(got.userId)).toBe(OID);
    expect(got.email).toBe("v@example.com");
  });

  it("takes the id from the Vendor's matching User when the offer had none", () => {
    const got = pickVendorIdentity({
      ownerId: null,
      owner: null,
      vendor: { email: "v@example.com", brandName: "Acme" },
      vendorUser: { _id: OID, name: "Acme Owner" },
    });
    expect(String(got.userId)).toBe(OID);
    expect(got.name).toBe("Acme");
  });

  it("uses the wizard's business email when neither User nor Vendor has one", () => {
    const got = pickVendorIdentity({
      ownerId: OID,
      owner: null,
      vendor: { email: "" },
      submissionEmail: "typed-into-the-wizard@example.com",
      offerName: "listing",
    });
    expect(got.email).toBe("typed-into-the-wizard@example.com");
  });

  it("respects the order: User, then Vendor, then submission", () => {
    const all = {
      ownerId: OID,
      owner: { email: "a@x.c" },
      vendor: { email: "b@x.c" },
      submissionEmail: "c@x.c",
    };
    expect(pickVendorIdentity(all).email).toBe("a@x.c");
    expect(pickVendorIdentity({ ...all, owner: null }).email).toBe("b@x.c");
    expect(pickVendorIdentity({ ...all, owner: null, vendor: null }).email).toBe("c@x.c");
  });

  it("returns the id with a null email rather than giving up entirely", () => {
    // Enough to raise the in-app bell, which needs no address.
    const got = pickVendorIdentity({ ownerId: OID, owner: null, vendor: null, offerName: "x" });
    expect(got.userId).toBe(OID);
    expect(got.email).toBeNull();
    expect(got.name).toBe("x");
  });

  it("is empty only when there is genuinely nothing — no id and no address", () => {
    expect(pickVendorIdentity({})).toEqual({ userId: null, email: null, name: "" });
    expect(pickVendorIdentity({ ownerId: null, owner: null, vendor: null })).toEqual({
      userId: null,
      email: null,
      name: "",
    });
  });

  it("falls back through the name candidates without ever rendering undefined", () => {
    expect(
      pickVendorIdentity({ ownerId: OID, owner: {}, vendor: { brandName: "Brand" } }).name,
    ).toBe("Brand");
    expect(pickVendorIdentity({ ownerId: OID, owner: {}, vendor: {} }).name).toBe("there");
    expect(
      pickVendorIdentity({ ownerId: OID, owner: {}, vendor: {}, offerName: "Listing" }).name,
    ).toBe("Listing");
  });
});
