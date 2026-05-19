interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
}

export function TableSkeleton({ rows = 6, columns = 4, showAvatar = false }: TableSkeletonProps) {
  const widths = ["w-32", "w-24", "w-28", "w-20", "w-16", "w-24"];

  return (
    <tbody>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-gray-100 animate-pulse">
          {/* First column */}
          <td className="px-4 py-2.5">
            {showAvatar ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                <div className="w-24 h-3 bg-gray-200 rounded" />
              </div>
            ) : (
              <div className="w-32 h-3 bg-gray-200 rounded" />
            )}
          </td>

          {/* Middle columns */}
          {Array.from({ length: Math.max(0, columns - 2) }).map((_, ci) => (
            <td key={ci} className="px-4 py-2.5">
              <div className={`${widths[ci % widths.length]} h-3 bg-gray-200 rounded`} />
            </td>
          ))}

          {/* Last column — badge shape */}
          {columns > 1 && (
            <td className="px-4 py-2.5">
              <div className="w-16 h-5 bg-gray-200 rounded-full" />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
}

export default TableSkeleton;
