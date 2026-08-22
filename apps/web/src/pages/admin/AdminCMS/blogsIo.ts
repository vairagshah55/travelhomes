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
import type { BlogPayload } from "@/services/cms";

/**
 * CSV import/export for the CMS Blogs tab.
 *
 * Pure functions, no React and no network, so the rules are testable
 * (`blogsIo.spec.ts`). Shares its CSV primitives with the Features and FAQs
 * tabs via `csvIo.ts`.
 *
 * ── Design decisions ──────────────────────────────────────────────────────
 *
 * • **Import never deletes.** A post missing from the file is left alone.
 *   Import creates and updates only, so a partial file can't empty the blog.
 *
 * • **Matching is by `id`, then `slug`, then `title`.** Round-tripping an export
 *   keeps ids so edits land in place. A hand-written file matches on slug first
 *   because that's the post's stable public identity; title is the last resort
 *   and is compared case-insensitively.
 *
 * • **A blank `status` on a new post means `draft`, not `published`.** The API
 *   defaults to published, which is the wrong default for a bulk import — a
 *   mis-mapped column would put unfinished drafts straight onto the public
 *   journal. An export always writes the column, so a round-trip preserves what
 *   you had; only a hand-written file with no `status` gets the safe default,
 *   and the row carries a warning saying so.
 *
 * • **An update with no `slug` cell re-sends the existing slug.** This is not
 *   redundant. `blogs.service.update` re-derives the slug from the title
 *   whenever a title arrives without one, so importing a spelling fix to a
 *   headline would silently change the post's URL and break every inbound link.
 *   Sending the current slug pins it.
 *
 * • **`content` is HTML and travels as-is.** The RFC 4180 parser handles the
 *   embedded commas, quotes and newlines that guarantees. It is *not* sanitised
 *   here — the public page sanitises at render time
 *   (`components/site/article.tsx`), which is the layer that has to be right
 *   regardless of how the row got in.
 */

/** Column order for export. Import accepts these in any order. */
export const BLOG_CSV_COLUMNS = [
  "id",
  "title",
  "slug",
  "category",
  "status",
  "description",
  "authorName",
  "authorRole",
  "authorImg",
  "coverImage",
  "metaTitle",
  "metaKeywords",
  "metaDescription",
  "content",
] as const;

/** Mirrors `Server/modules/blogs/blogs.dto.js` → `createBody`. */
const LIMITS = {
  title: 200,
  slug: 200,
  category: 80,
  description: 2000,
  content: 200_000,
  coverImage: 2000,
  authorName: 120,
  authorImg: 2000,
  authorRole: 80,
  metaTitle: 200,
  metaKeywords: 500,
  metaDescription: 2000,
};

export type BlogStatus = "published" | "draft";

/** The slug shape the server's DTO accepts: lowercase, digits, single hyphens. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A blog row as the admin tab holds it. */
export interface BlogRecord extends BlogPayload {
  _id?: string;
  id?: string;
  slug?: string;
  createdAt?: string;
}

export const blogId = (b: BlogRecord) => String(b._id || b.id || "");

/* ── Serialising ─────────────────────────────────────────────────────────── */

export function blogsToCsv(blogs: BlogRecord[]): string {
  return buildCsv(
    BLOG_CSV_COLUMNS,
    blogs.map((b) => [
      blogId(b),
      b.title ?? "",
      b.slug ?? "",
      b.category ?? "",
      b.status === "draft" ? "draft" : "published",
      b.description ?? "",
      b.authorName ?? "",
      b.authorRole ?? "",
      b.authorImg ?? "",
      b.coverImage ?? "",
      b.metaTitle ?? "",
      b.metaKeywords ?? "",
      b.metaDescription ?? "",
      b.content ?? "",
    ]),
  );
}

/**
 * A one-row CSV showing the expected columns, for someone starting from
 * scratch rather than from an export.
 */
export function blogsCsvTemplate(): string {
  return buildCsv(BLOG_CSV_COLUMNS, [
    [
      "",
      "How to plan a Himalayan road trip",
      "how-to-plan-a-himalayan-road-trip",
      "Road trips",
      "draft",
      "One or two lines shown in the article list.",
      "Asha Menon",
      "Travel writer",
      "",
      "",
      "How to plan a Himalayan road trip | TravelHomes",
      "himalaya, road trip, camper van",
      "Everything you need to plan your first Himalayan camper trip.",
      "<p>Write the article body here. HTML is supported.</p>",
    ],
  ]);
}

/* ── Planning ────────────────────────────────────────────────────────────── */

export interface PlannedBlogRow extends PlannedRowBase {
  /** Exactly what will be sent to the API for this row. */
  payload: BlogPayload;
  /** Set when the row matched an existing post. */
  existing?: BlogRecord;
}

/**
 * Turn parsed CSV into an explicit list of what would happen, writing nothing.
 * The modal renders this as a dry run so the admin sees "6 new, 2 updated, 1
 * problem" before anything is committed.
 */
export function buildBlogImportPlan(
  csvText: string,
  existing: BlogRecord[],
): ImportPlan<PlannedBlogRow> {
  const grid = parseCsv(csvText);
  if (!grid.length) return fatalPlan("That file is empty.");

  const { headers, read, has } = headerReader(grid[0]);
  if (!has("title")) {
    return fatalPlan(
      'The file needs a "title" column. Export the current list to see the expected format.',
      headers,
    );
  }

  const byId = new Map(existing.map((b) => [blogId(b), b]));
  const bySlug = new Map(existing.filter((b) => b.slug).map((b) => [norm(b.slug), b]));
  const byTitle = new Map(existing.map((b) => [norm(b.title), b]));

  const seenSlugs = new Set<string>();
  const seenTitles = new Set<string>();
  const rows: PlannedBlogRow[] = [];

  for (let i = 1; i < grid.length; i++) {
    const raw = grid[i];
    const line = i + 1;

    const id = read(raw, "id");
    const title = read(raw, "title");
    const slugCell = read(raw, "slug");
    const category = read(raw, "category");
    const description = read(raw, "description");
    const content = read(raw, "content");
    const coverImage = read(raw, "coverImage");
    const authorName = read(raw, "authorName");
    const authorRole = read(raw, "authorRole");
    const authorImg = read(raw, "authorImg");
    const metaTitle = read(raw, "metaTitle");
    const metaKeywords = read(raw, "metaKeywords");
    const metaDescription = read(raw, "metaDescription");
    const statusCell = norm(read(raw, "status"));

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!title) errors.push("Title is required");

    for (const [label, value, limit] of [
      ["Title", title, LIMITS.title],
      ["Slug", slugCell, LIMITS.slug],
      ["Category", category, LIMITS.category],
      ["Description", description, LIMITS.description],
      ["Content", content, LIMITS.content],
      ["Cover image", coverImage, LIMITS.coverImage],
      ["Author name", authorName, LIMITS.authorName],
      ["Author role", authorRole, LIMITS.authorRole],
      ["Author image", authorImg, LIMITS.authorImg],
      ["Meta title", metaTitle, LIMITS.metaTitle],
      ["Meta keywords", metaKeywords, LIMITS.metaKeywords],
      ["Meta description", metaDescription, LIMITS.metaDescription],
    ] as const) {
      const problem = tooLong(label, value, limit);
      if (problem) errors.push(problem);
    }

    if (slugCell && !SLUG_RE.test(slugCell)) {
      errors.push(
        `Slug "${slugCell}" is invalid — use lowercase letters, digits and single hyphens`,
      );
    }
    if (statusCell && statusCell !== "published" && statusCell !== "draft") {
      // `archived` exists in the model but the admin UI has no way to reach it,
      // so accepting it from a file would create rows the tab can't edit back.
      errors.push(`Status must be "published" or "draft" (found "${statusCell}")`);
    }

    // Duplicates *within the file* — two rows claiming one post would have the
    // second silently overwrite the first.
    if (slugCell && seenSlugs.has(norm(slugCell))) {
      errors.push("Duplicate slug — an earlier row in this file already uses it");
    }
    if (!slugCell && title && seenTitles.has(norm(title))) {
      errors.push("Duplicate title — an earlier row in this file already uses it");
    }
    if (slugCell) seenSlugs.add(norm(slugCell));
    if (title) seenTitles.add(norm(title));

    // id → slug → title. Most stable identifier first.
    const match =
      (id && byId.get(id)) ||
      (slugCell && bySlug.get(norm(slugCell))) ||
      (title ? byTitle.get(norm(title)) : undefined) ||
      undefined;

    if (id && !byId.has(id)) {
      warnings.push("No post with that id in this list — matched on slug/title instead");
    }

    const isUpdate = !!match;
    const status: BlogStatus =
      statusCell === "published" || statusCell === "draft"
        ? statusCell
        : isUpdate
          ? match!.status === "draft"
            ? "draft"
            : "published"
          : "draft";

    if (!statusCell && !isUpdate) {
      warnings.push('No status column — importing as "draft" so it stays off the public site');
    }

    /* Only send what the row actually carries. An absent column must not blank
       an existing value, which is the difference between "import the two
       columns I edited" and "wipe everything I left out". */
    const payload: BlogPayload = { title, status };
    if (category) payload.category = category;
    if (description) payload.description = description;
    if (content) payload.content = content;
    if (coverImage) payload.coverImage = coverImage;
    if (authorName) payload.authorName = authorName;
    if (authorRole) payload.authorRole = authorRole;
    if (authorImg) payload.authorImg = authorImg;
    if (metaTitle) payload.metaTitle = metaTitle;
    if (metaKeywords) payload.metaKeywords = metaKeywords;
    if (metaDescription) payload.metaDescription = metaDescription;

    if (slugCell) {
      payload.slug = slugCell;
    } else if (isUpdate && match!.slug) {
      /* Pin the existing slug. `blogs.service.update` re-derives the slug from
         the title when one arrives without it, so omitting this would let a
         headline fix silently change the post's public URL. */
      payload.slug = match!.slug;
    }

    rows.push({
      line,
      action: errors.length ? "error" : isUpdate ? "update" : "create",
      title: title || "(untitled)",
      subtitle:
        [payload.slug || "slug from title", category].filter(Boolean).join(" · ") || undefined,
      payload,
      existing: match,
      errors,
      warnings,
    });
  }

  return finalisePlan(rows, headers);
}
