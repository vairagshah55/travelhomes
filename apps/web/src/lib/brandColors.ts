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

export const BRAND = "#0F5C8A";           // ocean-500 — primary CTA
export const BRAND_HOVER = "#14709F";     // ocean-600 — lighter on hover
export const BRAND_ACCENT = "#1E88BA";    // ocean-400 — mid accent, charts
export const BRAND_BG = "rgba(15, 92, 138, 0.07)";
export const BRAND_FOCUS = "rgba(15, 92, 138, 0.15)";
export const BRAND_BORDER = "rgba(15, 92, 138, 0.30)";

export const NAVY = "#0A4670";            // ocean-700 — footer, sidebar
export const INK = "#0A2B40";             // ocean-800 — hero bg, primary text

export const CHAMPAGNE = "#C8A96A";       // luxury accent fill (warm pairing)
export const CHAMPAGNE_TINT = "#E7D3A6";  // soft tint background
export const CHAMPAGNE_TEXT = "#8C6F33";  // contrast-safe text
