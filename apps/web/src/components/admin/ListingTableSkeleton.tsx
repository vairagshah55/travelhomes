import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ListingTableSkeletonProps {
  /** Number of skeleton rows to render. Defaults to 6 — roughly fills the viewport. */
  rows?: number;
}

/**
 * Skeleton placeholder for ManagementListing's table body. Mirrors the live
 * row layout (vendor-id / name / category / price / location / actions) so
 * the page doesn't reflow when real data arrives.
 */
export default function ListingTableSkeleton({ rows = 6 }: ListingTableSkeletonProps) {
  return (
    <div role="status" aria-label="Loading listings" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`grid grid-cols-12 gap-3 items-center ${
            i !== rows - 1 ? "border border-gray-100" : ""
          }`}
        >
          {/* Vendor ID */}
          <div className="col-span-1 text-center border-r px-4 py-4 h-full flex items-center justify-center">
            <Skeleton className="h-4 w-14" />
          </div>

          {/* Name + cover image */}
          <div className="col-span-4 border-r px-4 py-4 h-full flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>

          {/* Category */}
          <div className="col-span-2 border-r px-4 py-4 h-full flex items-center justify-center">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Price */}
          <div className="col-span-2 border-r px-4 py-4 h-full flex items-center justify-center">
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Location */}
          <div className="col-span-2 border-r px-4 py-4 h-full flex items-center justify-center">
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Actions */}
          <div className="col-span-1 px-4 py-4 h-full flex items-center justify-center">
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
