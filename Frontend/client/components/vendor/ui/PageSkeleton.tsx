import React from "react";
import TableSkeleton from "./TableSkeleton";

interface PageSkeletonProps {
  showStats?: boolean;
  showTabs?: boolean;
  tableRows?: number;
  tableColumns?: number;
}

export function PageSkeleton({
  showStats = true,
  showTabs = true,
  tableRows = 6,
  tableColumns = 5,
}: PageSkeletonProps) {
  return (
    <div className="p-5 space-y-5 animate-pulse">
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {showTabs && (
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {Array.from({ length: tableColumns }).map((_, i) => (
                <th key={i} className="bg-gray-50 dark:bg-gray-800 px-3 py-3 text-left">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
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
