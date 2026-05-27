/**
 * Derive up to two uppercase initials from a person's name.
 * "Vairag Shah" -> "VS", "Badal" -> "BA", "" -> fallback ("A").
 *
 * Used by the admin header + sidebar avatar fallbacks so they render the
 * authenticated admin's initials instead of a hardcoded "VS".
 */
export function getInitials(name?: string | null, fallback = "A"): string {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default getInitials;
