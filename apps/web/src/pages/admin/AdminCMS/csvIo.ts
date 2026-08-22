/**
 * CSV primitives shared by every CMS import/export tab.
 *
 * Extracted from `featuresIo.ts` when Blogs and FAQs gained the same feature.
 * An RFC 4180 parser is exactly the kind of thing that must exist once: three
 * hand-rolled copies would drift, and only the copy with tests would be right.
 *
 * Everything here is pure — no React, no network — so the rules can be tested
 * directly (`csvIo.spec.ts`).
 */

/* ── Serialising ─────────────────────────────────────────────────────────── */

/** Quote a field only when it needs it, doubling any embedded quotes. */
export function escapeField(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Header row + data rows as one CSV document.
 *
 * CRLF is what RFC 4180 specifies and what Excel expects.
 */
export function buildCsv(headers: readonly string[], rows: readonly unknown[][]): string {
  const lines = rows.map((cells) => cells.map(escapeField).join(","));
  return [headers.join(","), ...lines].join("\r\n");
}

/**
 * Hand a CSV to the browser as a download.
 *
 * The leading BOM is deliberate: without it Excel reads the file as the local
 * ANSI codepage and mangles every non-ASCII character on open — which for this
 * app means every ₹ and every curly quote in a blog post.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** `blogs-2026-08-22.csv` */
export function stampedFilename(prefix: string, today: Date, ext = "csv"): string {
  const stamp = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return `${slug(prefix) || "export"}-${stamp}.${ext}`;
}

export function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ── Parsing ─────────────────────────────────────────────────────────────── */

/**
 * RFC 4180 CSV → grid of cells.
 *
 * A `split(",")` would have been shorter and wrong: blog descriptions and FAQ
 * answers routinely contain commas, and a quoted field may span newlines — a
 * blog's HTML body reliably does. This walks the string once tracking quote
 * state, treats `""` as an escaped quote, handles LF and CRLF, and strips a
 * UTF-8 BOM.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  // Trailing field/row, unless the file simply ended with a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop rows that are entirely empty (blank lines between records).
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Trim + lowercase, for case-insensitive matching of headers and keys. */
export const norm = (s?: string) => (s || "").trim().toLowerCase();

/**
 * Header index + a reader, so a plan builder can pull columns by name in any
 * order the file happens to use.
 */
export function headerReader(headerRow: string[]) {
  const headers = headerRow.map(norm);
  return {
    headers,
    has: (key: string) => headers.includes(norm(key)),
    /** Cell value for `key`, trimmed. Empty string when the column is absent. */
    read: (row: string[], key: string) => {
      const i = headers.indexOf(norm(key));
      return i === -1 ? "" : (row[i] ?? "").trim();
    },
  };
}

/* ── Planning ────────────────────────────────────────────────────────────── */

export type PlannedAction = "create" | "update" | "error";

/**
 * The shape the review step renders, whatever the record type.
 *
 * `title`/`subtitle` are display-only: the modal is generic, so each tab
 * decides how its rows should read in the preview list.
 */
export interface PlannedRowBase {
  /** 1-based line in the source file, counting the header — for error messages. */
  line: number;
  action: PlannedAction;
  title: string;
  subtitle?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportPlan<R extends PlannedRowBase> {
  rows: R[];
  creates: R[];
  updates: R[];
  errors: R[];
  /** Header names present in the file, lower-cased. */
  headers: string[];
  /** Set when the file can't be used at all. */
  fatal?: string;
}

/** Bucket planned rows by action, so every plan builder reports consistently. */
export function finalisePlan<R extends PlannedRowBase>(
  rows: R[],
  headers: string[],
): ImportPlan<R> {
  return {
    rows,
    headers,
    creates: rows.filter((r) => r.action === "create"),
    updates: rows.filter((r) => r.action === "update"),
    errors: rows.filter((r) => r.action === "error"),
  };
}

/** An empty plan carrying a fatal message — the file was unusable. */
export function fatalPlan<R extends PlannedRowBase>(
  fatal: string,
  headers: string[] = [],
): ImportPlan<R> {
  return { rows: [], creates: [], updates: [], errors: [], headers, fatal };
}

/**
 * Flag a value that exceeds a server-side limit, before the request is made.
 *
 * Mirroring the DTO caps here turns "row 43 failed with a 400 halfway through"
 * into a problem the admin sees in the dry run.
 */
export function tooLong(label: string, value: string, limit: number): string | null {
  return value.length > limit ? `${label} is over ${limit} characters` : null;
}
