/**
 * Money and date helpers for the revenue page.
 *
 * Replaces the old `revenue/tokens.ts`, which re-exported `BRAND`/`INK` from
 * `@/lib/brandColors` — a path CONVENTIONS.md marks for deletion. Colour now
 * comes from Tailwind tokens; this file only carries formatting.
 */

/** Full Indian grouping: 1234567 → "₹12,34,567". */
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * Compact Indian currency for axis ticks, where "₹12,34,567" won't fit.
 * Uses lakh/crore rather than K/M — this is an India-facing product.
 */
export const inrCompact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
};

/**
 * Amounts arrive pre-formatted from the API — `booking-details.service.js`
 * builds `servicePrice` as `` `₹ ${b.totalAmount}` ``. Rendering that inside
 * another "₹ {amount}" template produced "₹ ₹ 5000", so pull the number back
 * out and let the UI own the currency symbol.
 *
 * Lives in utils/currency now — the same endpoint also returns raw
 * BookingDetail rows where the field is a Number, so this is needed well
 * outside the revenue page. Re-exported here so existing imports keep working.
 */
export { toAmount } from "@/utils/currency";

/**
 * The API sends dates as "DD/MM/YYYY" (`formatDDMMYYYY` in
 * booking-details.service.js). `new Date("15/03/2026")` is an Invalid Date, and
 * `new Date("03/04/2026")` silently parses as March 4th instead of April 3rd —
 * so the payment table showed "Invalid Date" for any day past the 12th and the
 * wrong date for the rest. Parse the parts explicitly.
 */
export const parseDMY = (s?: string): Date | null => {
  if (!s) return null;
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s.trim());
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/** "15/03/2026" → "15 Mar 2026". */
export const formatDMY = (s?: string) => {
  const d = parseDMY(s);
  return d
    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
};
