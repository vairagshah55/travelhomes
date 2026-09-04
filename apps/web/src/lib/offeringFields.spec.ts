import { describe, expect, it } from "vitest";
import {
  ALL_FIELDS,
  ARRAY_FIELDS,
  EMPTY,
  ENUM_FIELDS,
  FUEL_OPTIONS,
  FUEL_POLICY_OPTIONS,
  NUMERIC_FIELDS,
  REQUIRED_FIELDS,
  SECTIONS,
  TOLLS_OPTIONS,
  pickOfferingValues,
  serializeOfferingValues,
  TRANSMISSION_OPTIONS,
  VEHICLE_CLASS_OPTIONS,
  VENDOR_HANDLED,
  vendorFieldsFor,
  vendorStepOf,
  type Kind,
} from "./offeringFields";
import {
  FUEL_POLICIES,
  FUEL_TYPES,
  TOLLS_POLICIES,
  TRANSMISSIONS,
  VEHICLE_CLASSES,
} from "@/components/onboarding/vehicle/vehicleConfig";

const NAMES = ALL_FIELDS.map((f) => f.name);
const KINDS: Kind[] = ["unique-stay", "camper-van", "activity", "vehicle-rental"];
const values = (list: readonly { value: string }[]) => [...list.map((o) => o.value)].sort();

describe("the registry is internally consistent", () => {
  it("declares each field exactly once", () => {
    const seen = new Set<string>();
    const dupes = NAMES.filter((n) => (seen.has(n) ? true : (seen.add(n), false)));
    expect(dupes).toEqual([]);
  });

  /* The serialisation lists decide whether a value is sent as an array, cast to
     a number, or dropped when empty. A name that no longer matches a field is
     dead weight; a field missing from them is a cast error on save. */
  it.each([
    ["ARRAY_FIELDS", ARRAY_FIELDS],
    ["NUMERIC_FIELDS", NUMERIC_FIELDS],
    ["ENUM_FIELDS", ENUM_FIELDS],
    ["REQUIRED_FIELDS", REQUIRED_FIELDS],
  ])("only lists real field names in %s", (_label, list) => {
    expect(list.filter((n) => !NAMES.includes(n))).toEqual([]);
  });

  /* buildInitial seeds form state from EMPTY, so a field absent from it opens
     as `undefined` — an uncontrolled input that React then warns about and that
     never round-trips its saved value. */
  it("has a blank value in EMPTY for every field", () => {
    expect(NAMES.filter((n) => !(n in EMPTY))).toEqual([]);
  });

  it("gives every select its options", () => {
    const selects = ALL_FIELDS.filter((f) => f.control === "select");
    expect(selects.length).toBeGreaterThan(0);
    expect(selects.filter((f) => !f.options?.length).map((f) => f.name)).toEqual([]);
  });

  it("scopes every field to a service type that exists", () => {
    const bad = ALL_FIELDS.filter((f) => f.only?.some((k) => !KINDS.includes(k)));
    expect(bad.map((f) => f.name)).toEqual([]);
  });
});

/* The whole point of the registry: the admin form and the vendor wizards agree
   on what the enum values ARE. Labels differ by surface on purpose — the vendor
   copy is fuller — but a value that drifts is a Mongoose cast error on save. */
describe("admin and vendor offer the same enum values", () => {
  it.each([
    ["vehicle class", values(VEHICLE_CLASS_OPTIONS), values(VEHICLE_CLASSES)],
    ["fuel policy", values(FUEL_POLICY_OPTIONS), values(FUEL_POLICIES)],
    ["tolls & parking", values(TOLLS_OPTIONS), values(TOLLS_POLICIES)],
  ])("%s", (_label, admin, vendor) => {
    expect(admin).toEqual(vendor);
  });

  it("fuel type", () => {
    expect(values(FUEL_OPTIONS)).toEqual([...FUEL_TYPES].sort());
  });

  it("transmission", () => {
    expect(values(TRANSMISSION_OPTIONS)).toEqual([...TRANSMISSIONS].sort());
  });
});

describe("every field reaches the vendor wizards", () => {
  /* A field with no vendor step is invisible to vendors however it is scoped —
     which is the drift this registry exists to make impossible. Adding a
     section means adding it to SECTION_VENDOR_STEP. */
  it("assigns a vendor step to every field", () => {
    const orphans = ALL_FIELDS.filter((f) => vendorStepOf(f.name) === null);
    expect(orphans.map((f) => f.name)).toEqual([]);
  });

  /* A typo in VENDOR_HANDLED silently un-hides nothing and hides nothing —
     the field just renders twice, once bespoke and once generically. */
  it("only marks real field names as already collected", () => {
    const bad: string[] = [];
    (["create", "edit"] as const).forEach((surface) =>
      KINDS.forEach((kind) =>
        VENDOR_HANDLED[surface][kind].forEach((n) => {
          if (!NAMES.includes(n)) bad.push(`${surface}/${kind}: ${n}`);
        }),
      ),
    );
    expect(bad).toEqual([]);
  });

  it("never offers a vendor the fields that decide ownership or taxonomy", () => {
    const leaked = (["create", "edit"] as const).flatMap((surface) =>
      KINDS.flatMap((kind) =>
        (["category", "basics", "features", "location", "pricing"] as const).flatMap((step) =>
          vendorFieldsFor(surface, kind, step)
            .map((f) => f.name)
            .filter((n) => n === "vendorId" || n === "serviceType"),
        ),
      ),
    );
    expect(leaked).toEqual([]);
  });

  /* The concrete gap this closed: /offering/add collected neither the room
     counts nor the check-in times a stay is stored with, so a vendor creating a
     listing there could not set them and the edit page showed them blank. */
  it("fills the create wizard's stay gaps that the edit wizard already covers", () => {
    const onCreate = vendorFieldsFor("create", "unique-stay", "location").map((f) => f.name);
    expect(onCreate).toEqual(
      expect.arrayContaining([
        "numberOfRooms",
        "numberOfBeds",
        "numberOfBathrooms",
        "checkInTime",
        "checkOutTime",
      ]),
    );

    const onEdit = vendorFieldsFor("edit", "unique-stay", "location").map((f) => f.name);
    expect(onEdit).not.toContain("checkInTime");
    expect(onEdit).not.toContain("numberOfRooms");
  });

  it("leaves the vehicle rate card to VehiclePricingStep", () => {
    const generic = vendorFieldsFor("edit", "vehicle-rental", "pricing").map((f) => f.name);
    expect(generic).not.toContain("selfDrivePerDay");
    expect(generic).not.toContain("fuelPolicy");
  });

  it("does not re-ask a camper van for a headline price it derives", () => {
    const generic = vendorFieldsFor("edit", "camper-van", "pricing").map((f) => f.name);
    expect(generic).not.toContain("regularPrice");
    expect(generic).not.toContain("perKmCharge");
  });

  it("keeps a section's fields out of a step that does not own them", () => {
    const onFeatures = vendorFieldsFor("edit", "vehicle-rental", "features").map((f) => f.name);
    expect(onFeatures).not.toContain("brand");
    expect(SECTIONS.map((s) => s.key)).toContain("rates");
  });
});

/* The one save path all four surfaces now share. Each rule below is a save that
   failed silently before it existed, so each gets its own case. */
describe("serializing form state into an update body", () => {
  it("sends tag fields as arrays, however they were held", () => {
    const out = serializeOfferingValues({ features: "WiFi, Parking ,", rules: ["No pets"] });
    expect(out.features).toEqual(["WiFi", "Parking"]);
    expect(out.rules).toEqual(["No pets"]);
  });

  it("drops a number that was never filled in", () => {
    expect("securityDeposit" in serializeOfferingValues({ securityDeposit: "" })).toBe(false);
  });

  /* Dropping the key would leave the old figure in place, so an emptied field
     has to be sent as an explicit null instead. */
  it("nulls a number the operator cleared", () => {
    const out = serializeOfferingValues({ securityDeposit: "" }, { securityDeposit: 5000 });
    expect(out.securityDeposit).toBeNull();
  });

  /* "" is not "no value" to Mongoose — it fails the enum and rejects the whole
     update rather than just that field. */
  it("applies the same rule to enums", () => {
    expect("fuelPolicy" in serializeOfferingValues({ fuelPolicy: "" })).toBe(false);
    expect(serializeOfferingValues({ fuelPolicy: "" }, { fuelPolicy: "included" }).fuelPolicy).toBe(
      null,
    );
  });

  it("keeps a number that has a value", () => {
    expect(serializeOfferingValues({ securityDeposit: "2500" }).securityDeposit).toBe("2500");
  });

  /* There is no top-level `finalPrice` path on the model, so strict mode used to
     drop everything typed into that field. */
  it("mirrors the discounted price onto the path the model actually has", () => {
    expect(serializeOfferingValues({ finalPrice: "900" }).discountPrice).toBe("900");
  });

  it("derives the chauffeur trip direction from the single switch", () => {
    expect(serializeOfferingValues({ withDriverTwoWay: true }).withDriverOneWay).toBe(false);
    expect(serializeOfferingValues({ withDriverTwoWay: false }).withDriverOneWay).toBe(true);
  });

  /* The vendor wizards serialise only the fields they rendered generically and
     build the rest by hand — passing the whole form state would have them
     overwrite the curated payload. */
  it("restricts the body to the named fields when asked", () => {
    const out = serializeOfferingValues(
      { stayType: "entire", city: "Jaipur" },
      {},
      ["stayType"],
    );
    expect(out).toEqual({ stayType: "entire" });
  });
});

describe("seeding generic state from a saved listing", () => {
  it("takes only registry fields, with tag fields normalised", () => {
    const out = pickOfferingValues({
      stayType: "entire",
      features: "WiFi,Pool",
      _id: "abc",
      someLegacyKey: 1,
    });
    expect(out.features).toEqual(["WiFi", "Pool"]);
    expect(out.stayType).toBe("entire");
    expect("_id" in out).toBe(false);
    expect("someLegacyKey" in out).toBe(false);
  });

  it("is empty for a listing that is not there yet", () => {
    expect(pickOfferingValues(null)).toEqual({});
  });
});
