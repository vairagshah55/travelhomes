/**
 * Pacific Teal-Blue brand palette — canonical JS constants.
 *
 * Use these for places that cannot consume CSS custom properties:
 * - Recharts `color={}` props
 * - SVG `fill` / `stroke` attributes
 * - Library configs that take hex strings
 *
 * For CSS / Tailwind, prefer the token utilities:
 *   bg-th-brand, text-th-brand, bg-ocean-500, etc.
 */

export const BRAND = "#117479"; // ocean-500 — primary CTA
export const BRAND_HOVER = "#128086"; // ocean-600 — lighter on hover
export const BRAND_ACCENT = "#128086"; // ocean-400 — mid accent, charts
export const BRAND_BG = "rgba(59, 217, 218, 0.14)";
export const BRAND_FOCUS = "rgba(59, 217, 218, 0.3)";
export const BRAND_BORDER = "rgba(59, 217, 218, 0.6)";

export const NAVY = "#0d4548"; // ocean-700 — footer, sidebar
export const INK = "#0a1c1c"; // ocean-800 — hero bg, primary text

export const CHAMPAGNE = "#C8A96A"; // luxury accent fill (warm pairing)
export const CHAMPAGNE_TINT = "#E7D3A6"; // soft tint background
export const CHAMPAGNE_TEXT = "#8C6F33"; // contrast-safe text
