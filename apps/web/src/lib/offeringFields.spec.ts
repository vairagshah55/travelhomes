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
  WIZARD_STEPS,
  appliesTo,
  hasMeaningfulValue,
  isFieldRelevant,
  wizardStepsFor,
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
const field = (name: string) => {
  const f = ALL_FIELDS.find((x) => x.name === name);
  if (!f) throw new Error(`no such field: ${name}`);
  return f;
};
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

  /* These controls read from the CMS catalog, the vendor directory or the
     service-type picker — data the generic vendor renderer has no access to, so
     it skips them. One reaching the remainder would mean a field silently
     missing from the vendor wizards, which is the whole failure this registry
     exists to prevent. */
  it("never leaves a surface-owned control to the generic renderer", () => {
    const owned = ["features", "category", "vendor", "serviceType"];
    const leaked = (["create", "edit"] as const).flatMap((surface) =>
      KINDS.flatMap((kind) =>
        (["category", "basics", "features", "location", "pricing"] as const).flatMap((step) =>
          vendorFieldsFor(surface, kind, step)
            .filter((f) => owned.includes(f.control ?? "text"))
            .map((f) => `${surface}/${kind}: ${f.name} (${f.control})`),
        ),
      ),
    );
    expect(leaked).toEqual([]);
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

describe("deciding which fields a listing shows", () => {
  /* The bug this replaced: `EMPTY` seeds four vehicle switches as `false` on
     EVERY listing, and the old rule counted any non-empty key as "the record
     has this" — so a unique stay opened with a Vehicle section and a full
     Rental rates card. */
  it.each(["airConditioned", "selfDriveEnabled", "withDriverEnabled", "withDriverTwoWay"])(
    "does not treat the off switch %s as data",
    (name) => {
      expect(hasMeaningfulValue(name, { ...EMPTY })).toBe(false);
      expect(isFieldRelevant(field(name), "unique-stay", { ...EMPTY })).toBe(false);
    },
  );

  it("keeps a blank stay clear of every vehicle field", () => {
    const vehicleOnly = ALL_FIELDS.filter((f) => f.only?.length === 1 && f.only[0] === "vehicle-rental");
    expect(vehicleOnly.length).toBeGreaterThan(20);
    const shown = vehicleOnly.filter((f) => isFieldRelevant(f, "unique-stay", { ...EMPTY }));
    expect(shown.map((f) => f.name)).toEqual([]);
  });

  it("still shows an out-of-scope field the record really carries", () => {
    const values = { ...EMPTY, selfDrivePerDay: "2500", airConditioned: true };
    expect(isFieldRelevant(field("selfDrivePerDay"), "unique-stay", values)).toBe(true);
    expect(isFieldRelevant(field("airConditioned"), "unique-stay", values)).toBe(true);
  });

  /* The server writes an unanswered rate as 0 rather than omitting it, so a 0
     would otherwise reveal a section that has nothing in it. */
  it("treats a rate of zero as unanswered", () => {
    expect(hasMeaningfulValue("selfDrivePerDay", { selfDrivePerDay: 0 })).toBe(false);
    expect(hasMeaningfulValue("selfDrivePerDay", { selfDrivePerDay: "0" })).toBe(false);
    expect(hasMeaningfulValue("selfDrivePerDay", { selfDrivePerDay: 1 })).toBe(true);
  });

  it("ignores an empty tag list but keeps a filled one", () => {
    expect(hasMeaningfulValue("pickupPoints", { pickupPoints: [] })).toBe(false);
    expect(hasMeaningfulValue("pickupPoints", { pickupPoints: ["Depot"] })).toBe(true);
  });

  it("shows a vehicle its own fields", () => {
    expect(isFieldRelevant(field("fuelPolicy"), "vehicle-rental", { ...EMPTY })).toBe(true);
  });

  /* A listing whose serviceType says nothing, and the operator's own escape
     hatch, both show everything rather than hiding fields on a guess. */
  it("shows everything when the type is unknown or the operator asks", () => {
    expect(isFieldRelevant(field("fuelPolicy"), null, { ...EMPTY })).toBe(true);
    expect(isFieldRelevant(field("fuelPolicy"), "unique-stay", { ...EMPTY }, true)).toBe(true);
  });

  it("always shows an unscoped field", () => {
    expect(isFieldRelevant(field("name"), "unique-stay", {})).toBe(true);
  });
});

describe("never writing a blank over a field the record didn't have", () => {
  /* The concrete loss: the admin edit form never mapped `checkInTime`, so it
     opened as "" and the save wrote that "" over the stay's stored time. */
  it("drops a blank string the record never carried", () => {
    const out = serializeOfferingValues({ checkInTime: "", stayType: "" }, {});
    expect("checkInTime" in out).toBe(false);
    expect("stayType" in out).toBe(false);
  });

  it("sends a cleared string as empty, so clearing one still works", () => {
    const out = serializeOfferingValues({ checkInTime: "" }, { checkInTime: "14:00" });
    expect(out.checkInTime).toBe("");
  });

  it("still nulls a cleared number and a cleared enum", () => {
    expect(serializeOfferingValues({ securityDeposit: "" }, { securityDeposit: 500 })
      .securityDeposit).toBeNull();
    expect(serializeOfferingValues({ fuelPolicy: "" }, { fuelPolicy: "included" })
      .fuelPolicy).toBeNull();
  });

  /* An emptied tag list is a real edit — the operator removed every item — so
     it has to reach the server as [] rather than being dropped. */
  it("sends an emptied tag list rather than dropping it", () => {
    const out = serializeOfferingValues({ features: [] }, { features: ["WiFi"] });
    expect(out.features).toEqual([]);
    const untouched = serializeOfferingValues({ features: [] }, { features: [] });
    expect(untouched.features).toEqual([]);
  });

  it("leaves values that are actually set alone", () => {
    const out = serializeOfferingValues(
      { checkInTime: "14:00", securityDeposit: "2500", name: "Cabins" },
      {},
    );
    expect(out).toMatchObject({ checkInTime: "14:00", securityDeposit: "2500", name: "Cabins" });
  });
});

/* The admin edit form walks the onboarding flow's steps. Two groupings of one
   field set means one of them can lose a field, so these assert the wizard is a
   true partition of what applies to each service type. */
describe("the admin wizard mirrors the onboarding flows", () => {
  it.each(KINDS)("covers every field that applies to %s, exactly once", (kind) => {
    const listed = WIZARD_STEPS[kind].flatMap((s) => s.fields ?? []);

    const dupes = listed.filter((n, i) => listed.indexOf(n) !== i);
    expect(dupes).toEqual([]);

    const applicable = ALL_FIELDS.filter((f) => appliesTo(f, kind)).map((f) => f.name);
    expect([...applicable].sort()).toEqual([...listed].sort());
  });

  it.each(KINDS)("only names real fields for %s", (kind) => {
    const bad = WIZARD_STEPS[kind]
      .flatMap((s) => s.fields ?? [])
      .filter((n) => !NAMES.includes(n));
    expect(bad).toEqual([]);
  });

  /* A field scoped away from a kind must not appear in that kind's steps, or
     the form would show a vehicle rate card on a stay again. */
  it.each(KINDS)("never puts another type's field on %s", (kind) => {
    const leaked = WIZARD_STEPS[kind]
      .flatMap((s) => s.fields ?? [])
      .map((n) => field(n))
      .filter((f) => f.only && !f.only.includes(kind))
      .map((f) => f.name);
    expect(leaked).toEqual([]);
  });

  it.each(KINDS)("gives %s the custom blocks that apply to it", (kind) => {
    const custom = WIZARD_STEPS[kind].map((s) => s.custom).filter(Boolean);
    // Every listing has photos.
    expect(custom).toContain("photos");
    // Rooms is a stay concept only — the model's `rooms` array is never used by
    // the other three.
    expect(custom.includes("rooms")).toBe(kind === "unique-stay");
    /* Discounts are collected by the stay, caravan and activity wizards. The
       vehicle wizard never did, and nothing guest-facing reads `discounts` for
       a vehicle, so they are gone from every vehicle surface. */
    expect(custom.includes("discounts")).toBe(kind !== "vehicle-rental");
  });

  /* `onlyKinds` on a custom SECTION and the per-kind WIZARD_STEPS table are two
     descriptions of the same scope, and no renderer reads the first — so only a
     test can stop them drifting. Without this, scoping a custom block in one
     place and forgetting the other is invisible until someone reads both. */
  it.each(KINDS)("scopes custom sections and %s's wizard steps identically", (kind) => {
    const stepBlocks = new Set(WIZARD_STEPS[kind].map((s) => s.custom).filter(Boolean));
    SECTIONS.filter((s) => s.custom).forEach((section) => {
      const sectionApplies = !section.onlyKinds || section.onlyKinds.includes(kind);
      expect(
        stepBlocks.has(section.custom),
        `${section.custom}: SECTIONS says ${sectionApplies}, WIZARD_STEPS["${kind}"] says ${stepBlocks.has(section.custom)}`,
      ).toBe(sectionApplies);
    });
  });

  /* The step ORDER is the point of this table: an admin reviewing a stay should
     walk the screens the host filled in, in the order they filled them. */
  it("matches the stay flow's step order", () => {
    expect(WIZARD_STEPS["unique-stay"].map((s) => s.key)).toEqual([
      "property-type",
      "category",
      "stay-details",
      "rooms",
      "photos",
      "features",
      "discounts",
    ]);
  });

  it("keeps each flow's own phase vocabulary", () => {
    const phases = (kind: Kind) => [...new Set(WIZARD_STEPS[kind].map((s) => s.phase))];
    expect(phases("unique-stay")).toEqual(["Your stay", "Pricing"]);
    expect(phases("camper-van")).toEqual(["Your caravan", "Pricing"]);
    expect(phases("activity")).toEqual(["Your activity", "Pricing"]);
    /* Vehicles carry a third phase, matching VEHICLE_PHASES in
       pages/onboarding/VehicleOnboarding ("Your vehicle" / "Pricing" /
       "Documents" — its fourth, "About you", is vendor-only and has no admin
       equivalent). The Documents step must stay LAST: the rail groups
       consecutive steps by label, so placing it between Pricing and Photos
       would split Pricing into two groups. */
    expect(phases("vehicle-rental")).toEqual(["Your vehicle", "Pricing", "Documents"]);
  });

  it("drops a step whose fields are all hidden, and keeps the custom ones", () => {
    const steps = wizardStepsFor("unique-stay", () => false);
    expect(steps.map((s) => s.key)).toEqual(["rooms", "photos", "discounts"]);
  });

  it("resolves field names to specs in the order the step lists them", () => {
    const steps = wizardStepsFor("unique-stay", () => true);
    const first = steps.find((s) => s.key === "property-type");
    expect(first?.fields.map((f) => f.name)).toEqual([
      "vendorId",
      "serviceType",
      "stayType",
      "name",
      "description",
    ]);
  });

  /* A listing whose serviceType says nothing has no flow to mirror, so it falls
     back to the schema-domain sections rather than being forced into one. */
  it("falls back to the schema sections when the type is unknown", () => {
    const steps = wizardStepsFor(null, () => true);
    expect(steps.map((s) => s.key)).toEqual(SECTIONS.map((s) => s.key));
  });
});
