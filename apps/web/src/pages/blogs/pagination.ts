/**
 * Paging arithmetic for the /blogs index.
 *
 * Its own module rather than a const inside `Blogs.tsx` so the windowing edge
 * cases (first page, last page, short archives) can be tested without pulling
 * the whole page — and with it Header, Footer and framer-motion — into a test
 * run.
 */

/** How many posts one page of the index holds. */
export const PAGE_SIZE = 12;

/** A page number to render, or a gap where numbers have been elided. */
export type PageEntry = number | "gap";

/**
 * Page numbers to show around the current one.
 *
 * The first and last page are always present, so either end of the archive
 * stays one click away however deep you are. Up to seven pages are listed in
 * full — below that a gap marker would be longer than the numbers it replaces.
 */
export function pageWindow(page: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  // Interior neighbours only: 1 and `totalPages` are added explicitly, and
  // near either end this collapses to one or two entries rather than three.
  const middle = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages);

  const out: PageEntry[] = [1];
  if (middle[0] > 2) out.push("gap");
  out.push(...middle);
  if (middle[middle.length - 1] < totalPages - 1) out.push("gap");
  out.push(totalPages);
  return out;
}
