import { describe, expect, it } from "vitest";

import {
  ICON_LIBRARY,
  ICON_NAMES,
  inferIconName,
  isLucideIcon,
  lucideComponentFor,
  LUCIDE_PREFIX,
} from "./featureIcons";

describe("icon library", () => {
  it("has no duplicate keywords across icons", () => {
    // A keyword owned by two icons makes inference order-dependent.
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const name of ICON_NAMES) {
      for (const k of ICON_LIBRARY[name].keywords) {
        const key = k.toLowerCase();
        if (seen.has(key) && seen.get(key) !== name) clashes.push(`"${k}" → ${seen.get(key)} / ${name}`);
        seen.set(key, name);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("gives every icon a label and a group", () => {
    for (const name of ICON_NAMES) {
      expect(ICON_LIBRARY[name].label, name).toBeTruthy();
      expect(ICON_LIBRARY[name].group, name).toBeTruthy();
    }
  });
});

describe("lucide token round-trip", () => {
  it("recognises and resolves a token", () => {
    expect(isLucideIcon(`${LUCIDE_PREFIX}wifi`)).toBe(true);
    expect(lucideComponentFor(`${LUCIDE_PREFIX}wifi`)).toBe(ICON_LIBRARY.wifi.Icon);
  });

  it("treats an upload path as not-a-token", () => {
    expect(isLucideIcon("/uploads/icon.png")).toBe(false);
    expect(lucideComponentFor("/uploads/icon.png")).toBeUndefined();
  });

  it("resolves an unknown token to undefined rather than throwing", () => {
    expect(lucideComponentFor(`${LUCIDE_PREFIX}not-a-real-icon`)).toBeUndefined();
  });

  it("keeps every token inside the server's 500-char icon cap", () => {
    for (const name of ICON_NAMES) {
      expect(`${LUCIDE_PREFIX}${name}`.length).toBeLessThan(500);
    }
  });
});

describe("inferIconName", () => {
  it("matches the real Camper Van feature names from the database", () => {
    const cases: Record<string, string> = {
      "Wheelchair Accessible": "accessibility",
      "Camping Table": "table",
      "Camping Chairs": "armchair",
      "Rooftop Terrace": "sun",
      "Air Conditioning": "wind",
      Heating: "flame",
      "Wi-Fi": "wifi",
      TV: "tv",
      Microwave: "microwave",
      Refrigerator: "refrigerator",
      Toilet: "toilet",
      "Fire Extinguisher": "fire-extinguisher",
      "First Aid Kit": "bandage",
      CCTV: "cctv",
      "Bunk Beds": "layers",
      "Pet Friendly": "paw-print",
      "Solar Power": "sun",
      "Charging Points": "cable",
      Generator: "zap",
      "Bike Rack": "bike",
    };
    for (const [name, expected] of Object.entries(cases)) {
      expect(inferIconName(name), name).toBe(expected);
    }
  });

  it("prefers the longer, more specific keyword", () => {
    // "outdoor kitchen" must not settle for a generic outdoor match.
    expect(inferIconName("Outdoor Kitchen")).toBe("cooking-pot");
  });

  it("is case- and separator-insensitive", () => {
    expect(inferIconName("WI-FI / INTERNET")).toBe("wifi");
    expect(inferIconName("bathroom_toilet")).toBe("bath");
  });

  it("returns null for something genuinely unrecognisable", () => {
    expect(inferIconName("Zorbing Flumox")).toBeNull();
    expect(inferIconName("")).toBeNull();
  });

  it("does not match a keyword that is only a partial word", () => {
    // "car" must not fire on "Caravan".
    expect(inferIconName("Caravan")).not.toBe("car-front");
  });
});
