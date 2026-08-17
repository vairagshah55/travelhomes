import React from "react";
import { PANEL, PANEL_FLUSH } from "./Panel";
import TableSkeleton from "./TableSkeleton";

interface PageSkeletonProps {
  showStats?: boolean;
  showTabs?: boolean;
  tableRows?: number;
  tableColumns?: number;
}

/**
 * Whole-page loading state for a list surface: stat row, tab strip, table.
 *
 * It mirrors the real page's composition — same `PANEL` geometry, same 2-up
 * stat grid, same table rows — so the layout does not reflow when data lands.
 * The previous version drew its own rounded boxes in literal greys, which meant
 * the skeleton and the page it stood in for had different radii and a different
 * neutral, and the swap was visible as a flicker.
 */
export function PageSkeleton({
  showStats = true,
  showTabs = true,
  tableRows = 6,
  tableColumns = 5,
}: PageSkeletonProps) {
  return (
    <div className="space-y-5 animate-pulse">
      {showStats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${PANEL} px-4 py-3.5`}>
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="mt-3 h-6 w-24 rounded bg-muted" />
              <div className="mt-3 h-2.5 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {showTabs && (
        <div className="flex items-center gap-4 border-b border-border pb-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3.5 w-20 rounded bg-muted" />
          ))}
        </div>
      )}

      <div className={PANEL_FLUSH}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="h-9 flex-1 max-w-xs rounded-xl bg-muted" />
          <div className="h-9 w-24 rounded-lg bg-muted ml-auto" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: tableColumns }).map((_, i) => (
                <th key={i} className="px-3 py-2.5 text-left">
                  <div className="h-2.5 w-16 rounded bg-muted" />
                </th>
              ))}
            </tr>
          </thead>
          <TableSkeleton rows={tableRows} columns={tableColumns} />
        </table>
      </div>
    </div>
  );
}

export default PageSkeleton;
