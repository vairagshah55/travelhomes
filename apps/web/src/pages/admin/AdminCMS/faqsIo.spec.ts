import { describe, expect, it } from "vitest";

import { parseCsv } from "./csvIo";
import { buildFaqImportPlan, FAQ_CSV_COLUMNS, faqsToCsv } from "./faqsIo";
import type { FAQ } from "./types";

const faq = (over: Partial<FAQ> = {}): FAQ => ({
  id: "f1",
  category: "Booking",
  question: "Can I cancel a booking?",
  answer: "Yes, up to 48 hours before check-in.",
  ...over,
});

const csv = (cols: string[], ...rows: string[][]) =>
  [cols.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

describe("faqsToCsv", () => {
  it("writes the documented columns", () => {
    expect(parseCsv(faqsToCsv([faq()]))[0]).toEqual([...FAQ_CSV_COLUMNS]);
  });

  it("writes the category as its display label, whatever case it's stored in", () => {
    // Existing rows hold "unique stay"; the UI and the file use "Unique Stay".
    const grid = parseCsv(faqsToCsv([faq({ category: "unique stay" })]));
    expect(grid[1][FAQ_CSV_COLUMNS.indexOf("category")]).toBe("Unique Stay");
  });

  it("omits isActive entirely — it can't be imported back", () => {
    expect(FAQ_CSV_COLUMNS).not.toContain("isActive");
  });

  it("round-trips an answer containing a comma and a newline", () => {
    const answer = 'Yes, within 48 hours.\nCall us on "1800".';
    const grid = parseCsv(faqsToCsv([faq({ answer })]));
    expect(grid[1][FAQ_CSV_COLUMNS.indexOf("answer")]).toBe(answer);
  });
});

describe("buildFaqImportPlan — matching", () => {
  const existing = [faq()];

  it("updates in place on an export round-trip", () => {
    const plan = buildFaqImportPlan(faqsToCsv(existing), existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.creates).toHaveLength(0);
  });

  it("matches on category + question when there's no id", () => {
    const file = csv(
      ["category", "question", "answer"],
      ["Booking", "Can I cancel a booking?", "Updated answer"],
    );
    const plan = buildFaqImportPlan(file, existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].answer).toBe("Updated answer");
  });

  it("treats the same question in another category as a separate entry", () => {
    /* "How do I cancel?" legitimately exists under both Booking and Guest —
       matching on question alone would merge them. */
    const file = csv(
      ["category", "question", "answer"],
      ["Guest", "Can I cancel a booking?", "Guest-side answer"],
    );
    const plan = buildFaqImportPlan(file, existing);
    expect(plan.creates).toHaveLength(1);
    expect(plan.updates).toHaveLength(0);
  });

  it("matches regardless of stored category case", () => {
    const stored = [faq({ category: "unique stay" })];
    const file = csv(
      ["category", "question", "answer"],
      ["Unique Stay", "Can I cancel a booking?", "A"],
    );
    expect(buildFaqImportPlan(file, stored).updates).toHaveLength(1);
  });
});

describe("buildFaqImportPlan — categories are validated, not invented", () => {
  it("rejects a category outside the offered list", () => {
    const file = csv(["category", "question", "answer"], ["Refunds", "Q?", "A"]);
    const plan = buildFaqImportPlan(file, []);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors.join(" ")).toMatch(/isn't one of the FAQ categories/i);
  });

  it("normalises a case variant and says so", () => {
    const file = csv(["category", "question", "answer"], ["booking", "Q?", "A"]);
    const plan = buildFaqImportPlan(file, []);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].category).toBe("Booking");
    expect(plan.creates[0].warnings.join(" ")).toMatch(/normalised/i);
  });
});

describe("buildFaqImportPlan — rejections", () => {
  it("is fatal on an empty file", () => {
    expect(buildFaqImportPlan("", []).fatal).toMatch(/empty/i);
  });

  it("is fatal without a question column", () => {
    expect(buildFaqImportPlan("category,answer\r\nBooking,A", []).fatal).toMatch(/question/i);
  });

  it("is fatal without a category column", () => {
    expect(buildFaqImportPlan("question,answer\r\nQ?,A", []).fatal).toMatch(/category/i);
  });

  it("requires an answer, because the server's DTO does", () => {
    const plan = buildFaqImportPlan(csv(["category", "question", "answer"], ["Booking", "Q?", ""]), []);
    expect(plan.errors[0].errors.join(" ")).toMatch(/answer is required/i);
  });

  it("catches an over-long answer before the request", () => {
    const file = csv(["category", "question", "answer"], ["Booking", "Q?", "x".repeat(20_001)]);
    expect(buildFaqImportPlan(file, []).errors[0].errors.join(" ")).toMatch(/over 20000/i);
  });

  it("rejects the same question twice in one category", () => {
    const file = csv(
      ["category", "question", "answer"],
      ["Booking", "Q?", "A"],
      ["Booking", "Q?", "B"],
    );
    const plan = buildFaqImportPlan(file, []);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors.join(" ")).toMatch(/duplicate question/i);
  });

  it("allows the same question in two different categories in one file", () => {
    const file = csv(
      ["category", "question", "answer"],
      ["Booking", "Q?", "A"],
      ["Guest", "Q?", "B"],
    );
    const plan = buildFaqImportPlan(file, []);
    expect(plan.creates).toHaveLength(2);
    expect(plan.errors).toHaveLength(0);
  });

  it("reports the source line for an error", () => {
    const file = csv(
      ["category", "question", "answer"],
      ["Booking", "Fine", "A"],
      ["Nonsense", "Bad", "A"],
    );
    expect(buildFaqImportPlan(file, []).errors[0].line).toBe(3);
  });
});

describe("buildFaqImportPlan — column order and extras", () => {
  it("reads columns in any order", () => {
    const file = csv(["answer", "question", "category"], ["A", "Q?", "Booking"]);
    const plan = buildFaqImportPlan(file, []);
    expect(plan.creates[0]).toMatchObject({ category: "Booking", question: "Q?", answer: "A" });
  });

  it("ignores unknown columns instead of failing", () => {
    const file = csv(
      ["category", "question", "answer", "isActive", "notes"],
      ["Booking", "Q?", "A", "true", "ignore me"],
    );
    const plan = buildFaqImportPlan(file, []);
    expect(plan.creates).toHaveLength(1);
    expect(plan.errors).toHaveLength(0);
  });
});
