import { buildCsv, downloadCsv, norm, parseCsv, slug } from "./csvIo";
import type { Feature } from "./types";

/* Re-exported so existing callers (and `featuresIo.spec.ts`) keep importing
   these from here after the primitives moved to `csvIo.ts`. */
export { downloadCsv, parseCsv };

/**
 * CSV import/export for the CMS Features tab.
 *
 * Kept as pure functions with no React and no network so the parsing and
 * planning rules can be tested directly (see `featuresIo.spec.ts`) — a CSV
 * parser written inline in a component is a parser nobody ever tests.
 *
 * ── Design decisions ──────────────────────────────────────────────────────
 *
 * • **Import targets the tab you're on.** The `category` and `type` columns are
 *   read and reported, but the rows are written into the currently selected
 *   offering category and mode. Trusting the file instead would let one stray
 *   cell scatter rows across Camper Van / Unique Stay / Activity with no
 *   warning, and the admin can't see the result without switching tabs.
 *
 * • **Import never deletes.** A row missing from the file is left alone. Import
 *   creates and updates only, so a partial file can't wipe the list.
 *
 * • **Matching is by `id`, then by name.** Round-tripping an export keeps ids,
 *   so edits update in place. A hand-written file with no id column still
 *   matches on name (case-insensitively) rather than creating duplicates.
 *
 * • **`icon` round-trips.** The server caps it at 500 characters
 *   (`cms.dto.js` → `featureBody`), so it's always a path or short URL, never
 *   an inlined image. Rows that arrive with an over-long icon are rejected here
 *   rather than by a 400 halfway through the run.
 */

/** Column order for export. Import accepts these in any order. */
export const CSV_COLUMNS = [
  "id",
  "name",
  "type",
  "category",
  "status",
  "description",
  "icon",
] as const;

/**
 * Optional extra column holding the icon image itself as a data URL.
 *
 * `icon` is only ever a *path* (`/uploads/icon-123.png`) — the server caps that
 * field at 500 characters, so an image can never live in it. That path is fine
 * for an export/edit/import round-trip inside one environment, but carries
 * nothing across environments: import the file into staging and every icon
 * points at an upload that isn't there.
 *
 * So "export with icons" adds this column, the importer uploads whatever it
 * finds in it, and writes the *new* path into `icon`. Kept out of the default
 * export because base64 images turn a readable spreadsheet into unreadable
 * multi-kilobyte cells — and Excel truncates any cell over 32,767 characters,
 * which is why `MAX_EMBEDDED_ICON_BYTES` exists.
 */
export const ICON_DATA_COLUMN = "iconData";

/** Header lookups are case-insensitive; this is the normalised form. */
const ICON_DATA_KEY = ICON_DATA_COLUMN.toLowerCase();

/** ~24KB of image → ~32KB of base64, just under Excel's per-cell ceiling. */
export const MAX_EMBEDDED_ICON_BYTES = 24_000;

/** Server limits, mirrored so a bad row is caught before the request. */
const LIMITS = { name: 200, description: 2000, icon: 500, category: 120, type: 60 };

export type FeatureStatus = "enable" | "disable";

/* ── Serialising ─────────────────────────────────────────────────────────── */

/**
 * @param iconData Optional `feature id → data URL`. When supplied, an
 *   `iconData` column is appended so the file carries the images themselves.
 *   Ids absent from the map simply get an empty cell.
 */
export function toCsv(features: Feature[], iconData?: Map<string, string>): string {
  const withIcons = !!iconData && iconData.size > 0;
  const headers = [...CSV_COLUMNS, ...(withIcons ? [ICON_DATA_COLUMN] : [])];

  return buildCsv(
    headers,
    features.map((f) => [
      f.id ?? "",
      f.name ?? "",
      f.type ?? "",
      f.category ?? "",
      f.status ?? "",
      f.description ?? "",
      f.icon ?? "",
      ...(withIcons ? [iconData!.get(f.id) ?? ""] : []),
    ]),
  );
}

/**
 * Fetch an icon and inline it as a data URL, for "export with icons".
 *
 * Resolves to `null` rather than throwing on anything that goes wrong — a
 * missing file, a CORS refusal, an oversized image. One unreachable icon must
 * not fail the whole export; that row just exports without an embedded image,
 * exactly as the default export would.
 */
export async function fetchIconAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size || blob.size > MAX_EMBEDDED_ICON_BYTES) return null;
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Turn an embedded `data:` URL back into a File the upload endpoint accepts. */
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl.trim());
  if (!match) return null;
  const [, mime, isBase64, payload] = match;
  try {
    const source = isBase64
      ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(payload));

    /* Copied into a plain ArrayBuffer rather than handed over directly: under
       TS 5.7+ `Uint8Array` is generic over `ArrayBufferLike`, which includes
       `SharedArrayBuffer` and so isn't assignable to `BlobPart`. */
    const buffer = new ArrayBuffer(source.byteLength);
    new Uint8Array(buffer).set(source);

    const ext = (mime.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "");
    return new File([buffer], `${filename}.${ext}`, { type: mime });
  } catch {
    return null;
  }
}

/* ── Planning ────────────────────────────────────────────────────────────── */

export type PlannedAction = "create" | "update" | "error";

export interface PlannedRow {
  /** 1-based line in the source file, counting the header — for error messages. */
  line: number;
  action: PlannedAction;
  name: string;
  description: string;
  /** Existing path, used as-is when there's no embedded image to upload. */
  icon: string;
  /** Embedded image from the `iconData` column. Uploaded at apply time, and the
      returned path wins over `icon`. */
  iconData: string;
  status: FeatureStatus;
  /** Set when the row matched an existing record. */
  existing?: Feature;
  errors: string[];
  warnings: string[];
}

export interface ImportPlan {
  rows: PlannedRow[];
  creates: PlannedRow[];
  updates: PlannedRow[];
  errors: PlannedRow[];
  /** Header names present in the file, lower-cased. */
  headers: string[];
  /** Set when the file can't be used at all. */
  fatal?: string;
}

/**
 * Turn parsed CSV into an explicit list of what would happen, without doing any
 * of it. The modal renders this as a dry run so nothing is written until the
 * admin has seen the counts.
 */
export function buildImportPlan(
  csvText: string,
  existing: Feature[],
  target: { category: string; type: string },
): ImportPlan {
  const empty: ImportPlan = { rows: [], creates: [], updates: [], errors: [], headers: [] };

  const grid = parseCsv(csvText);
  if (!grid.length) return { ...empty, fatal: "That file is empty." };

  const headers = grid[0].map((h) => norm(h));
  const nameIdx = headers.indexOf("name");
  if (nameIdx === -1) {
    return {
      ...empty,
      headers,
      fatal: 'The file needs a "name" column. Export the current list to see the expected format.',
    };
  }

  const col = (r: string[], key: string): string => {
    const i = headers.indexOf(key);
    return i === -1 ? "" : (r[i] ?? "").trim();
  };

  const byId = new Map(existing.map((f) => [f.id, f]));
  const byName = new Map(existing.map((f) => [norm(f.name), f]));
  const seenNames = new Set<string>();
  const rows: PlannedRow[] = [];

  for (let i = 1; i < grid.length; i++) {
    const raw = grid[i];
    const line = i + 1;

    const name = (raw[nameIdx] ?? "").trim();
    const id = col(raw, "id");
    const description = col(raw, "description");
    const icon = col(raw, "icon");
    const iconData = col(raw, ICON_DATA_KEY);
    const rawStatus = norm(col(raw, "status"));
    const rowCategory = col(raw, "category");
    const rowType = col(raw, "type");

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name) errors.push("Name is required");
    if (name.length > LIMITS.name) errors.push(`Name is over ${LIMITS.name} characters`);
    if (description.length > LIMITS.description)
      errors.push(`Description is over ${LIMITS.description} characters`);
    // Only the *path* is length-checked — `iconData` is an inlined image and is
    // never stored in that field; it's uploaded and replaced by the new path.
    if (!iconData && icon.length > LIMITS.icon)
      errors.push(`Icon path is over ${LIMITS.icon} characters`);
    /* Requires the payload, not just the `data:image/…` prefix. A data URL
       always contains a comma, so an unquoted iconData cell in a hand-edited
       file gets split and arrives as the bare "data:image/png;base64" stub. A
       looser check passed that through, the upload then silently produced
       nothing, and the row saved with no icon and no complaint. */
    if (iconData && !/^data:image\/[a-z0-9.+-]+;base64,.+/is.test(iconData))
      errors.push(
        "iconData must be a complete image data URL — if you edited the file by hand, wrap the cell in quotes",
      );
    if (rawStatus && rawStatus !== "enable" && rawStatus !== "disable")
      errors.push(`Status must be "enable" or "disable" (found "${rawStatus}")`);

    if (name && seenNames.has(norm(name))) {
      errors.push("Duplicate name — an earlier row in this file already uses it");
    }
    if (name) seenNames.add(norm(name));

    // Match: id first (survives renames), then name.
    const match = (id && byId.get(id)) || (name ? byName.get(norm(name)) : undefined);
    if (id && !byId.has(id)) {
      warnings.push("No record with that id in this list — matched by name instead");
    }
    if (rowCategory && norm(rowCategory) !== norm(target.category)) {
      warnings.push(`File says "${rowCategory}" — importing into "${target.category}"`);
    }
    if (rowType && norm(rowType) !== norm(target.type)) {
      warnings.push(`File says type "${rowType}" — importing as "${target.type}"`);
    }

    const status: FeatureStatus =
      rawStatus === "disable" || rawStatus === "enable"
        ? (rawStatus as FeatureStatus)
        : ((match?.status as FeatureStatus) ?? "enable");

    rows.push({
      line,
      action: errors.length ? "error" : match ? "update" : "create",
      name,
      description,
      icon,
      iconData,
      status,
      existing: match || undefined,
      errors,
      warnings,
    });
  }

  return {
    rows,
    headers,
    creates: rows.filter((r) => r.action === "create"),
    updates: rows.filter((r) => r.action === "update"),
    errors: rows.filter((r) => r.action === "error"),
  };
}

/** `features-camper-van-2026-08-17.csv` */
export function exportFilename(category: string, type: string, today: Date): string {
  const stamp = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return `${slug(type) || "features"}-${slug(category) || "all"}-${stamp}.csv`;
}
