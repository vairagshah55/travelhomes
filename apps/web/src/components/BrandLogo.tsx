import React from "react";

interface BrandLogoProps {
  /** "full" = mark + wordmark; "mark" = icon only. */
  variant?: "full" | "mark";
  /** Mark size in px (the wordmark scales with it). Default 36. */
  size?: number;
  /** Wordmark color treatment. "auto" adapts to light/dark; "light" forces a
   *  white "Travel" for dark/photo backgrounds (e.g. transparent hero header). */
  tone?: "auto" | "light" | "dark";
  className?: string;
}

/**
 * TravelHomes brand logo — pure vector (SVG mark + styled wordmark), so it stays
 * razor-sharp at any size/DPI ("HD"). The mark is a house with a location-dot
 * window in the brand gradient; the wordmark uses the brand token so it adapts
 * to light/dark and to the route-group brand.
 *
 * Usage:
 *   <BrandLogo />                       // full logo, default size
 *   <BrandLogo variant="mark" size={28} />  // icon only (sidebar collapsed / favicon-ish)
 */
export function BrandLogo({ variant = "full", size = 36, tone = "auto", className = "" }: BrandLogoProps) {
  const travelClass =
    tone === "light" ? "text-white" : tone === "dark" ? "text-[#0A2B40]" : "text-[#0A2B40] dark:text-white";
  const homesClass = tone === "light" ? "text-[#7FC4E8]" : "text-brand";
  const Mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden={variant === "full" ? true : undefined}
      role={variant === "mark" ? "img" : undefined}
      aria-label={variant === "mark" ? "TravelHomes" : undefined}
    >
      <defs>
        <linearGradient id="thBrandGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E88BA" />
          <stop offset="1" stopColor="#0F5C8A" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#thBrandGrad)" />
      <path d="M24 10.2 L37.6 21.4 V35.4 a2.6 2.6 0 0 1-2.6 2.6 H13 a2.6 2.6 0 0 1-2.6-2.6 V21.4 Z" fill="#fff" />
      <circle cx="24" cy="22.6" r="3.4" fill="url(#thBrandGrad)" />
      <rect x="20.6" y="29.4" width="6.8" height="8.6" rx="1.7" fill="url(#thBrandGrad)" />
    </svg>
  );

  if (variant === "mark") {
    return <span className={className}>{Mark}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {Mark}
      <span
        className="font-extrabold tracking-tight leading-none"
        style={{ fontSize: Math.round(size * 0.6) }}
      >
        <span className={travelClass}>Travel</span>
        <span className={homesClass}>Homes</span>
      </span>
    </span>
  );
}

export default BrandLogo;
