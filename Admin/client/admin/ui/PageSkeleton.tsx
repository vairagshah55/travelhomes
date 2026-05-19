import { TableSkeleton } from "./TableSkeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-[14px] animate-pulse">
      {/* Stat card skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[14px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-20 h-2.5 bg-gray-200 rounded" />
              <div className="w-12 h-4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab strip skeleton */}
      <div className="flex gap-3 border-b border-gray-200 pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-gray-200" style={{ width: `${60 + i * 10}px` }} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-surface-border overflow-hidden">
        <table className="w-full">
          <TableSkeleton rows={6} columns={5} showAvatar />
        </table>
      </div>
    </div>
  );
}

export default PageSkeleton;
