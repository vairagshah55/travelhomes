import { describe, expect, it } from "vitest";

import {
  buildImportPlan,
  dataUrlToFile,
  exportFilename,
  parseCsv,
  toCsv,
} from "./featuresIo";
import type { Feature } from "./types";

const feature = (over: Partial<Feature> = {}): Feature => ({
  id: "1",
  name: "Wheelchair Accessible",
  category: "Camper Van",
  status: "enable",
  icon: "/uploads/icon.png",
  description: "",
  ...over,
});

const TARGET = { category: "Camper Van", type: "feature" };

describe("parseCsv", () => {
  it("parses a simple grid", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    // The whole reason this isn't split(",") — descriptions have commas.
    expect(parseCsv('name,description\nWi-Fi,"Fast, free, everywhere"')).toEqual([
      ["name", "description"],
      ["Wi-Fi", "Fast, free, everywhere"],
    ]);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('name\n"He said ""hi"""')).toEqual([["name"], ['He said "hi"']]);
  });

  it("handles a newline inside a quoted field", () => {
    expect(parseCsv('name,description\nX,"line one\nline two"')).toEqual([
      ["name", "description"],
      ["X", "line one\nline two"],
    ]);
  });

  it("handles CRLF and a UTF-8 BOM", () => {
    expect(parseCsv("﻿name,id\r\nWi-Fi,7\r\n")).toEqual([
      ["name", "id"],
      ["Wi-Fi", "7"],
    ]);
  });

  it("drops blank lines", () => {
    expect(parseCsv("name\n\nWi-Fi\n\n")).toEqual([["name"], ["Wi-Fi"]]);
  });
});

describe("toCsv", () => {
  it("round-trips through parseCsv", () => {
    const rows = [
      feature({ id: "1", name: "Wi-Fi", description: "Fast, free" }),
      feature({ id: "2", name: 'Quote "test"', status: "disable", description: "a\nb" }),
    ];
    const grid = parseCsv(toCsv(rows));
    expect(grid[0]).toEqual(["id", "name", "type", "category", "status", "description", "icon"]);
    expect(grid[1][1]).toBe("Wi-Fi");
    expect(grid[1][5]).toBe("Fast, free");
    expect(grid[2][1]).toBe('Quote "test"');
    expect(grid[2][5]).toBe("a\nb");
    expect(grid[2][4]).toBe("disable");
  });
});

describe("buildImportPlan", () => {
  it("rejects a file with no name column", () => {
    const plan = buildImportPlan("id,status\n1,enable", [], TARGET);
    expect(plan.fatal).toMatch(/name/i);
  });

  it("rejects an empty file", () => {
    expect(buildImportPlan("", [], TARGET).fatal).toMatch(/empty/i);
  });

  it("creates rows that match nothing", () => {
    const plan = buildImportPlan("name\nSolar Panel", [], TARGET);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].name).toBe("Solar Panel");
    expect(plan.creates[0].status).toBe("enable");
  });

  it("updates by id even when the name changed", () => {
    const existing = [feature({ id: "abc", name: "Old name" })];
    const plan = buildImportPlan("id,name\nabc,New name", existing, TARGET);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].existing?.id).toBe("abc");
    expect(plan.updates[0].name).toBe("New name");
  });

  it("falls back to a case-insensitive name match so re-imports don't duplicate", () => {
    const existing = [feature({ id: "abc", name: "Wheelchair Accessible" })];
    const plan = buildImportPlan("name\nWHEELCHAIR ACCESSIBLE", existing, TARGET);
    expect(plan.updates).toHaveLength(1);
    expect(plan.creates).toHaveLength(0);
  });

  it("flags a duplicate name within the same file", () => {
    const plan = buildImportPlan("name\nWi-Fi\nwi-fi", [], TARGET);
    expect(plan.creates).toHaveLength(1);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors[0]).toMatch(/duplicate/i);
  });

  it("rejects a blank name, an over-long name and a bad status", () => {
    const csv = ["name,status", ",enable", `${"x".repeat(201)},enable`, "Ok,maybe"].join("\n");
    const plan = buildImportPlan(csv, [], TARGET);
    expect(plan.errors).toHaveLength(3);
    expect(plan.errors[0].errors[0]).toMatch(/required/i);
    expect(plan.errors[1].errors[0]).toMatch(/over 200/i);
    expect(plan.errors[2].errors[0]).toMatch(/enable/i);
  });

  it("rejects an icon over the server's 500-char cap before sending it", () => {
    const plan = buildImportPlan(`name,icon\nX,${"y".repeat(501)}`, [], TARGET);
    expect(plan.errors[0].errors[0]).toMatch(/icon/i);
  });

  it("warns, but does not block, when the file targets another category", () => {
    const plan = buildImportPlan("name,category\nSolar,Unique Stay", [], TARGET);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].warnings[0]).toMatch(/importing into "Camper Van"/);
  });

  it("keeps an existing row's status when the file omits the column", () => {
    const existing = [feature({ id: "abc", name: "Wi-Fi", status: "disable" })];
    const plan = buildImportPlan("name\nWi-Fi", existing, TARGET);
    expect(plan.updates[0].status).toBe("disable");
  });

  it("reports 1-based line numbers that include the header", () => {
    const plan = buildImportPlan("name\nOk\n", [], TARGET);
    expect(plan.rows[0].line).toBe(2);
  });

  it("tolerates ragged rows and any column order", () => {
    const plan = buildImportPlan("description,name\nSome text,Wi-Fi\n,Solar", [], TARGET);
    expect(plan.creates).toHaveLength(2);
    expect(plan.creates[0].description).toBe("Some text");
    expect(plan.creates[1].name).toBe("Solar");
  });
});

describe("icon handling", () => {
  const PNG = "data:image/png;base64,iVBORw0KGgo=";

  it("omits the iconData column unless icons were collected", () => {
    expect(toCsv([feature()]).split("\r\n")[0]).not.toContain("iconData");
  });

  it("appends iconData when a map is supplied, and leaves unmatched ids blank", () => {
    const rows = [feature({ id: "1" }), feature({ id: "2", name: "Second" })];
    const csv = toCsv(rows, new Map([["1", PNG]]));
    const grid = parseCsv(csv);
    expect(grid[0][7]).toBe("iconData");
    expect(grid[1][7]).toBe(PNG);
    expect(grid[2][7]).toBe("");
  });

  it("carries iconData onto the planned row", () => {
    // Quoted, because a data URL contains a comma — this is what toCsv emits.
    const plan = buildImportPlan(`name,iconData\nWi-Fi,"${PNG}"`, [], TARGET);
    expect(plan.creates[0].iconData).toBe(PNG);
  });

  it("survives a full toCsv → buildImportPlan round-trip with icons", () => {
    const rows = [feature({ id: "1", name: "Wi-Fi" })];
    const plan = buildImportPlan(toCsv(rows, new Map([["1", PNG]])), rows, TARGET);
    expect(plan.errors).toHaveLength(0);
    expect(plan.updates[0].iconData).toBe(PNG);
  });

  it("rejects an iconData cell that isn't an image data URL", () => {
    const plan = buildImportPlan("name,iconData\nWi-Fi,https://example.com/x.png", [], TARGET);
    expect(plan.errors[0].errors[0]).toMatch(/data URL/i);
  });

  it("rejects a data URL truncated by an unquoted comma, rather than silently dropping it", () => {
    const plan = buildImportPlan(`name,iconData\nWi-Fi,${PNG}`, [], TARGET);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors[0]).toMatch(/complete image data URL/i);
  });

  it("skips the 500-char path limit when an image is embedded instead", () => {
    // The long value is a path that would be rejected on its own, but iconData
    // means the stored path comes from the upload, not from this cell.
    const csv = `name,icon,iconData\nWi-Fi,${"y".repeat(600)},"${PNG}"`;
    expect(buildImportPlan(csv, [], TARGET).errors).toHaveLength(0);
  });

  it("decodes a data URL into an uploadable File", () => {
    const file = dataUrlToFile(PNG, "feature-wifi");
    expect(file).not.toBeNull();
    expect(file!.name).toBe("feature-wifi.png");
    expect(file!.type).toBe("image/png");
    expect(file!.size).toBeGreaterThan(0);
  });

  it("returns null for something that isn't a data URL", () => {
    expect(dataUrlToFile("/uploads/icon.png", "x")).toBeNull();
  });
});

describe("exportFilename", () => {
  it("slugs the category and stamps the date", () => {
    expect(exportFilename("Unique Stay", "category", new Date(2026, 7, 17))).toBe(
      "category-unique-stay-2026-08-17.csv",
    );
  });
});
