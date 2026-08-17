import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
}

/**
 * Placeholder rows for a loading table.
 *
 * Spelled in `border`/`muted` tokens rather than the literal `gray-200` /
 * `gray-700` pair it used to carry: on the vendor console those greys are a
 * different neutral family from the surrounding surface, so the skeleton read
 * as a slightly wrong-coloured table rather than as the same table, empty.
 *
 * Row height matches the real 40px console row — a skeleton that is taller or
 * shorter than its content makes the page jump the moment data lands, which is
 * the specific thing a skeleton exists to prevent.
 */
export function TableSkeleton({ rows = 6, columns = 5, showAvatar = false }: TableSkeletonProps) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border animate-pulse">
          {Array.from({ length: columns }).map((__, j) => (
            <td key={j} className="px-3 py-2.5">
              {showAvatar && j === 0 ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              ) : (
                <div
                  className={`h-3 rounded bg-muted ${
                    j === columns - 1 ? "w-8 ml-auto" : j === 0 ? "w-28" : "w-20"
                  }`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default TableSkeleton;
