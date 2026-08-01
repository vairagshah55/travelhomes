import React from "react";
import { cn } from "@/lib/utils";
import {
  BRAND_NAME,
  LOGO_ASPECT,
  logoSrc,
  type LogoShape,
  type LogoTone,
} from "@/lib/brand";

/** `"full"` is the legacy name for the header lockup — kept so older call sites work. */
type Variant = LogoShape | "full";

/**
 * - `auto` — black artwork that inverts to white under `.dark`. The default; one
 *   download, resolved by CSS so there's no wrong-tone flash on first paint.
 * - `light` / `dark` — legacy names describing the *surface*: `light` means "sitting
 *   on something dark, so paint me white".
 * - `color` / `black` / `white` — pick the artwork outright.
 */
type Tone = LogoTone | "auto" | "light" | "dark";

interface BrandLogoProps {
  variant?: Variant;
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  size?: number;
  tone?: Tone;
  className?: string;
  /** Skip the alt text when something adjacent already names the brand. */
  decorative?: boolean;
}

const TONE: Record<Tone, LogoTone> = {
  auto: "black", // .dark inverts it — see `invertible` below
  light: "white",
  dark: "black",
  color: "color",
  black: "black",
  white: "white",
};

/**
 * The TravelHomes logo, rendered from the delivered artwork in `public/brand/`.
 *
 * Height drives the size and the aspect ratio drives the width, so the shapes are
 * interchangeable in a layout without hand-tuning dimensions. The `width`/`height`
 * attributes are intrinsic hints (no layout shift) and stay overridable by
 * className, so `h-9 w-auto` still works where a caller needs CSS sizing.
 *
 *   <BrandLogo />                              // header lockup, adapts to dark mode
 *   <BrandLogo variant="stacked" size={80} />   // login / empty states
 *   <BrandLogo variant="name" size={17} />      // sidebar wordmark
 *   <BrandLogo tone="light" />                  // over a hero photo or dark footer
 */
export function BrandLogo({
  variant = "full",
  size = 40,
  tone = "auto",
  className = "",
  decorative = false,
}: BrandLogoProps) {
  const shape: LogoShape = variant === "full" ? "horizontal" : variant;
  const invertible = tone === "auto";
  const width = Math.round(size * LOGO_ASPECT[shape]);

  return (
    <img
      src={logoSrc(shape, TONE[tone])}
      width={width}
      height={size}
      alt={decorative ? "" : BRAND_NAME}
      aria-hidden={decorative || undefined}
      draggable={false}
      className={cn(
        "shrink-0 select-none object-contain",
        invertible && "dark:invert",
        className,
      )}
    />
  );
}

export default BrandLogo;
