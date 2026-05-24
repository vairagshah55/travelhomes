/**
 * Midnight Indigo brand palette — canonical JS constants.
 *
 * Use these for places that cannot consume CSS custom properties:
 * - Recharts `color={}` props
 * - SVG `fill` / `stroke` attributes
 * - Library configs that take hex strings
 *
 * For CSS / Tailwind, prefer the token utilities:
 *   bg-th-brand, text-th-brand, bg-ocean-700, etc.
 */

export const BRAND = "#1E3A8A";           // brand-700 — primary CTA
export const BRAND_HOVER = "#2D4DA8";     // brand-600
export const BRAND_ACCENT = "#3E63D3";    // brand-500 — mid accent, charts
export const BRAND_BG = "rgba(30, 58, 138, 0.07)";
export const BRAND_FOCUS = "rgba(30, 58, 138, 0.15)";
export const BRAND_BORDER = "rgba(30, 58, 138, 0.30)";

export const NAVY = "#11295A";            // brand-900 — footer, sidebar
export const INK = "#0A1E3D";             // hero bg, primary text

export const CHAMPAGNE = "#C8A96A";       // luxury accent fill
export const CHAMPAGNE_TINT = "#E7D3A6";  // soft tint background
export const CHAMPAGNE_TEXT = "#8C6F33";  // contrast-safe text

/** Legacy aliases — kept so existing `TEAL` re-exports keep compiling. */
export const TEAL = BRAND;
export const TEAL_BG = BRAND_BG;
export const TEAL_FOCUS = BRAND_FOCUS;
export const TEAL_BORDER = BRAND_BORDER;
