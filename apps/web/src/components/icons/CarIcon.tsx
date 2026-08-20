import React from "react";

/** Rental car/van/bus glyph for the Vehicle Rental filter pill. */
function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 15.5V11.2l1.7-4.4A2 2 0 0 1 8.07 5.5h7.86a2 2 0 0 1 1.87 1.3l1.7 4.4v4.3M4.5 15.5h15M4.5 15.5v2a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5v-2M19.5 15.5v2a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-2M5 11.5h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="13.4" r="0.85" fill="currentColor" />
      <circle cx="16" cy="13.4" r="0.85" fill="currentColor" />
    </svg>
  );
}

export default CarIcon;
