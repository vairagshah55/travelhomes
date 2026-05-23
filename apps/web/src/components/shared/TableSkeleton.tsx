import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
}

export function TableSkeleton({ rows = 6, columns = 5, showAvatar = false }: TableSkeletonProps) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-gray-100 dark:border-gray-800 animate-pulse">
          {Array.from({ length: columns }).map((__, j) => (
            <td key={j} className="px-3 py-4">
              {showAvatar && j === 0 ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ) : (
                <div
                  className={`h-3 bg-gray-200 dark:bg-gray-700 rounded ${
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
