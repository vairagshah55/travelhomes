/**
 * TravelHomes brand assets — single source of truth.
 *
 * Everything under `public/brand/` is generated from the delivered artwork in the
 * repo-root `Final Logo/` folder by `scripts/generate-brand-assets.py`. Re-run that
 * script (not an image editor) when the artwork changes.
 *
 * All lockups are one high-res alpha mask recoloured three ways, so the `black`
 * variant put through a CSS `invert` is pixel-identical to the `white` variant —
 * which is how `tone="auto"` in <BrandLogo> adapts to dark mode with a single
 * download and no theme flash on first paint.
 */

export const BRAND_NAME = "TravelHomes";
export const BRAND_TAGLINE = "Be At Home Everywhere";

/**
 * The artwork's cyan (#3BD9DA, sampled from the delivered "TH Logo.png" swatch) lives
 * in CSS as `--th-logo` / `bg-th-logo`, not as a constant here — see CONVENTIONS.md
 * Rule 3. Reach for the class; this file only owns file paths and geometry.
 */

/**
 * - `horizontal` — mark left, wordmark right. The header/sidebar lockup: at a given
 *   height its wordmark renders ~3x larger than the stacked lockup's, so it stays
 *   legible in a 40–64px row.
 * - `stacked` — the delivered lockup (mark over wordmark over tagline). Needs
 *   vertical room: login screens, empty states, print.
 * - `mark` — caravan + mountains + trees, no type.
 * - `wordmark` — "TRAVEL HOMES" + tagline.
 * - `name` — "TRAVEL HOMES" only. For tight rows where the tagline would be noise.
 * - `caravan` — caravan silhouette alone. Survives down to ~24px, so it's the
 *   compact/app-icon mark.
 */
export type LogoShape = "horizontal" | "stacked" | "mark" | "wordmark" | "name" | "caravan";

/** `color` is brand teal — it needs a dark or white surface to hold contrast. */
export type LogoTone = "color" | "black" | "white";

/** width ÷ height of each shape's artwork, so callers can size from height alone. */
export const LOGO_ASPECT: Record<LogoShape, number> = {
  horizontal: 4.627,
  stacked: 1.437,
  mark: 1.931,
  wordmark: 4.692,
  name: 8.361,
  caravan: 1.591,
};

export const logoSrc = (shape: LogoShape, tone: LogoTone) => `/brand/logo-${shape}-${tone}.png`;

/** Rounded brand-teal app icon with black artwork. 32–64 use the caravan alone. */
export type IconSize = 32 | 48 | 64 | 180 | 192 | 512;
export const iconSrc = (size: IconSize) => `/brand/icon-${size}.png`;

/** 1200x630 social preview — black lockup on brand teal. */
export const OG_IMAGE = "/brand/og-image.png";
