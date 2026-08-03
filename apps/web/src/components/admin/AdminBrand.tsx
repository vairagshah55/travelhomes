import React from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import { BRAND_NAME, logoSrc } from "@/lib/brand";

/**
 * Compact brand mark — the caravan silhouette on a rounded brand-teal tile.
 *
 * Black-on-teal is the delivered on-brand-colour treatment ("Small Blue BG.png"),
 * and at ~14:1 it stays readable down to the collapsed rail's 34px and the 32px
 * favicon. Square, so it also works as an avatar-shaped slot.
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
      aria-label={BRAND_NAME}
      className={cn(
        "grid place-items-center shrink-0 bg-th-logo",
        "shadow-[0_5px_14px_-4px_rgba(59, 217, 218,0.75)]",
        className,
      )}
      // Sized from the `size` prop, so these three can't be class names.
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }}
    >
      <img
        src={logoSrc("caravan", "black")}
        alt=""
        aria-hidden
        draggable={false}
        className="select-none object-contain"
        style={{ width: Math.round(size * 0.7) }}
      />
    </span>
  );
}

/**
 * Full horizontal lockup for admin headers and the open sidebar.
 *
 * `markSize` is the lockup's height (it used to be the mark's, which was the same
 * number) — kept under the old name so existing call sites read unchanged.
 */
export function AdminBrandLockup({ markSize = 34 }: { markSize?: number }) {
  return <BrandLogo variant="horizontal" size={markSize} />;
}

export default AdminBrandMark;
