/**
 * Ordering for CMS Feature rows (categories, amenities) in vendor-facing
 * pickers.
 *
 * The list endpoint sorts newest-first, which suits the admin table but shows a
 * curated list to vendors in reverse of the order it was entered. `sortOrder`
 * (set by the seed scripts) is the intended position; rows without one — an
 * amenity an admin just added — fall in after those that have one, oldest
 * first, so a new row lands at the end of the list rather than the top.
 */
const positionOf = (row: any) =>
  typeof row?.sortOrder === "number" ? row.sortOrder : Number.MAX_SAFE_INTEGER;

export function compareFeatureRows(a: any, b: any): number {
  const diff = positionOf(a) - positionOf(b);
  if (diff !== 0) return diff;
  return String(a?.createdAt || "").localeCompare(String(b?.createdAt || ""));
}

/** Non-mutating sort — the input is usually a react-query cache array. */
export function sortFeatureRows<T>(rows: T[]): T[] {
  return [...rows].sort(compareFeatureRows);
}
