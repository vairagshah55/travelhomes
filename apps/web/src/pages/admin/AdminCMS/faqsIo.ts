import {
  buildCsv,
  finalisePlan,
  fatalPlan,
  headerReader,
  norm,
  parseCsv,
  tooLong,
  type ImportPlan,
  type PlannedRowBase,
} from "./csvIo";
import { canonicalFaqCategory, FAQ_CATEGORIES } from "./faqCategories";
import type { FAQ } from "./types";

/**
 * CSV import/export for the CMS FAQs tab.
 *
 * Pure functions, no React and no network (`faqsIo.spec.ts` covers the rules).
 * Shares its CSV primitives with the Features and Blogs tabs via `csvIo.ts`.
 *
 * ── Design decisions ──────────────────────────────────────────────────────
 *
 * • **The whole list round-trips, not just the open tab.** Unlike Features —
 *   where import deliberately targets the selected category because a stray
 *   cell could scatter rows invisibly — an FAQ's category is a plain label from
 *   a known list, printed in its own column and validated against
 *   `FAQ_CATEGORIES`. So export covers every category and import honours the
 *   column. Anything else would make bulk-loading a help centre a
 *   seven-file job.
 *
 * • **Categories are validated, not invented.** A row naming a category outside
 *   `FAQ_CATEGORIES` is an error, not a silent new category: the public Help
 *   page renders a fixed set of tabs, so an unknown category would save fine
 *   and then be unreachable by any reader.
 *
 * • **Stored categories are lowercase, labels are Title Case.** Existing rows
 *   hold "unique stay" while the UI shows "Unique Stay" — see
 *   `faqCategories.ts`. Import canonicalises to the label so a file exported
 *   from this app re-imports without creating case-variant duplicates.
 *
 * • **Import never deletes**, and matches by `id`, then by category + question.
 *   Question alone isn't unique — "How do I cancel?" belongs under both Booking
 *   and Guest — so matching on it alone would merge two distinct entries.
 *
 * • **`isActive` is deliberately absent.** The model has the field but no admin
 *   screen exposes it, and `cms.dto.faqBody` is `.strict()` and rejects it on
 *   create. Exporting a column that can't be imported invites bug reports, so
 *   it's left out entirely; an import leaves each record's existing flag alone.
 */

/** Column order for export. Import accepts these in any order. */
export const FAQ_CSV_COLUMNS = ["id", "category", "question", "answer"] as const;

/** Mirrors `Server/modules/cms/cms.dto.js` → `faqBody`. */
const LIMITS = { category: 120, question: 2000, answer: 20_000 };

export const faqId = (f: FAQ) => String((f as { _id?: string })._id || f.id || "");

/* ── Serialising ─────────────────────────────────────────────────────────── */

export function faqsToCsv(faqs: FAQ[]): string {
  return buildCsv(
    FAQ_CSV_COLUMNS,
    faqs.map((f) => [
      faqId(f),
      // Written as the display label so a round-trip is stable, whatever case
      // the row happens to be stored in.
      canonicalFaqCategory(f.category) || f.category || "",
      f.question ?? "",
      f.answer ?? "",
    ]),
  );
}

/** A starter file for someone not working from an export. */
export function faqsCsvTemplate(): string {
  return buildCsv(FAQ_CSV_COLUMNS, [
    ["", FAQ_CATEGORIES[0], "How far in advance should I book?", "Two to three weeks in peak season."],
    ["", "Booking", "Can I cancel a booking?", "Yes — free of charge up to 48 hours before check-in."],
  ]);
}

/* ── Planning ────────────────────────────────────────────────────────────── */

export interface PlannedFaqRow extends PlannedRowBase {
  category: string;
  question: string;
  answer: string;
  existing?: FAQ;
}

/** `category + question`, folded, as the natural key for an FAQ. */
const faqKey = (category?: string, question?: string) =>
  `${norm(canonicalFaqCategory(category) || category)}::${norm(question)}`;

export function buildFaqImportPlan(
  csvText: string,
  existing: FAQ[],
): ImportPlan<PlannedFaqRow> {
  const grid = parseCsv(csvText);
  if (!grid.length) return fatalPlan("That file is empty.");

  const { headers, read, has } = headerReader(grid[0]);
  if (!has("question")) {
    return fatalPlan(
      'The file needs a "question" column. Export the current list to see the expected format.',
      headers,
    );
  }
  if (!has("category")) {
    return fatalPlan(
      'The file needs a "category" column, so each answer lands under the right heading.',
      headers,
    );
  }

  const byId = new Map(existing.map((f) => [faqId(f), f]));
  const byKey = new Map(existing.map((f) => [faqKey(f.category, f.question), f]));

  const seen = new Set<string>();
  const rows: PlannedFaqRow[] = [];

  for (let i = 1; i < grid.length; i++) {
    const raw = grid[i];
    const line = i + 1;

    const id = read(raw, "id");
    const rawCategory = read(raw, "category");
    const question = read(raw, "question");
    const answer = read(raw, "answer");

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!question) errors.push("Question is required");
    // The server's `faqBody` requires a non-empty answer, so an empty cell
    // would 400 mid-run rather than save a blank.
    if (!answer) errors.push("Answer is required");
    if (!rawCategory) errors.push("Category is required");

    for (const [label, value, limit] of [
      ["Category", rawCategory, LIMITS.category],
      ["Question", question, LIMITS.question],
      ["Answer", answer, LIMITS.answer],
    ] as const) {
      const problem = tooLong(label, value, limit);
      if (problem) errors.push(problem);
    }

    const category = canonicalFaqCategory(rawCategory);
    if (rawCategory && !category) {
      errors.push(
        `"${rawCategory}" isn't one of the FAQ categories (${FAQ_CATEGORIES.join(", ")})`,
      );
    } else if (rawCategory && category !== rawCategory) {
      warnings.push(`Category normalised to "${category}"`);
    }

    const key = faqKey(category || rawCategory, question);
    if (question && seen.has(key)) {
      errors.push("Duplicate question in this category — an earlier row in this file has it");
    }
    if (question) seen.add(key);

    const match = (id && byId.get(id)) || byKey.get(key) || undefined;
    if (id && !byId.has(id)) {
      warnings.push("No FAQ with that id in this list — matched on category + question instead");
    }

    rows.push({
      line,
      action: errors.length ? "error" : match ? "update" : "create",
      title: question || "(no question)",
      subtitle: category || rawCategory || undefined,
      category: category || rawCategory,
      question,
      answer,
      existing: match,
      errors,
      warnings,
    });
  }

  return finalisePlan(rows, headers);
}
