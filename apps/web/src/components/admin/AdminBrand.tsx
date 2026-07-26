import React from "react";
import { Caravan } from "lucide-react";

/**
 * TravelHomes admin brand mark — a rounded deep-teal tile with a white caravan
 * glyph (nods to the camper-van brand logo while staying crisp/vector at any
 * size). Solid #0d9488 to match the admin accent; square so it also works as
 * the collapsed-rail icon.
 */
export function AdminBrandMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="TravelHomes"
      className={`grid place-items-center shrink-0 rounded-[11px] text-white shadow-[0_5px_14px_-4px_rgba(13,148,136,0.65)] ${className}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(140deg, #12b3a4 0%, #0d9488 55%, #0b7d72 100%)",
      }}
    >
      <Caravan size={Math.round(size * 0.56)} strokeWidth={2} />
    </span>
  );
}

/** Full lockup: teal caravan mark + "TravelHomes" wordmark. */
export function AdminBrandLockup({ markSize = 34 }: { markSize?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <AdminBrandMark size={markSize} />
      <span className="font-extrabold tracking-tight leading-none text-[19px] whitespace-nowrap">
        <span className="text-[#101828]">Travel</span>
        <span className="text-[#0d9488]">Homes</span>
      </span>
    </span>
  );
}

export default AdminBrandMark;
