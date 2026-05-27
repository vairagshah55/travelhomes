import React from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Inbox,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  /** Tailwind width/util classes for the column (applied to th + td). */
  className?: string;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg";
}

export interface RowAction<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  variant?: "default" | "danger";
}

export interface BulkAction<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (selected: T[]) => void;
  variant?: "default" | "danger";
}

export interface SortState {
  sortBy: string;
  sortDir: "asc" | "desc";
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];

  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;

  /** True when a search/filter is active — switches the empty state to "no results". */
  hasActiveQuery?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  noResultsTitle?: string;
  noResultsDescription?: string;
  noResultsAction?: { label: string; onClick: () => void };

  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  rowActions?: RowAction<T>[];

  pagination?: PaginationState;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;

  getRowId?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
  className?: string;
}

const hideBelowClass: Record<NonNullable<ColumnDef<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

const alignClass: Record<NonNullable<ColumnDef<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Generic admin data table. Renders sortable headers, optional row selection +
 * per-row action menu, and owns the loading-skeleton / empty / no-results /
 * error states so every management page presents them identically.
 *
 * Sorting and pagination are controlled: provide `sortState`/`onSortChange` and
 * `pagination` and the parent decides whether to sort/page client- or
 * server-side. Omit them for a plain table over pre-sliced `data`.
 */
export function AdminDataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage = "Something went wrong while loading this data.",
  onRetry,
  hasActiveQuery = false,
  emptyIcon = Inbox,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  noResultsTitle = "No results found",
  noResultsDescription = "Try adjusting your search or filters.",
  noResultsAction,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  rowActions,
  pagination,
  sortState,
  onSortChange,
  getRowId,
  onRowClick,
  skeletonRows = 8,
  className = "",
}: AdminDataTableProps<T>) {
  const rowId = (row: T, index: number): string =>
    getRowId
      ? getRowId(row, index)
      : ((row as { _id?: string; id?: string })._id ??
          (row as { _id?: string; id?: string }).id ??
          String(index));

  const hasActions = !!rowActions?.length;
  const totalCols = columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  const pageIds = data.map(rowId);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected = pageIds.some((id) => selectedIds.includes(id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? selectedIds.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...selectedIds, ...pageIds])));
  };
  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    if (sortState?.sortBy === key) {
      onSortChange({ sortBy: key, sortDir: sortState.sortDir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ sortBy: key, sortDir: "asc" });
    }
  };

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all rows on this page"
                  disabled={data.length === 0}
                />
              </TableHead>
            )}
            {columns.map((col) => {
              const isSorted = sortState?.sortBy === col.key;
              const sortable = col.sortable && !!onSortChange;
              return (
                <TableHead
                  key={col.key}
                  className={`${col.className ?? ""} ${col.align ? alignClass[col.align] : ""} ${
                    col.hideBelow ? hideBelowClass[col.hideBelow] : ""
                  }`}
                >
                  {sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-app-accent transition-colors focus-visible:outline-none focus-visible:underline"
                      aria-label={`Sort by ${col.header}`}
                    >
                      {col.header}
                      {isSorted ? (
                        sortState!.sortDir === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
            {hasActions && <TableHead className="w-16 text-right pr-4">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="animate-pulse">
                {Array.from({ length: totalCols }).map((__, j) => (
                  <TableCell key={j}>
                    <div
                      className={`h-3 rounded bg-app-surface-2 ${
                        j === 0 ? "w-28" : j === totalCols - 1 ? "w-8 ml-auto" : "w-20"
                      }`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={totalCols} className="py-12">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 grid place-items-center">
                    <AlertCircle size={22} className="text-red-500" />
                  </div>
                  <p className="text-[13px] text-app-fg-muted max-w-sm">{errorMessage}</p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="rounded-full bg-app-accent px-4 h-9 text-[13px] font-semibold text-app-accent-fg hover:bg-app-accent-hover transition-colors"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={totalCols} className="p-0">
                {hasActiveQuery ? (
                  <EmptyState
                    icon={emptyIcon}
                    title={noResultsTitle}
                    description={noResultsDescription}
                    actionLabel={noResultsAction?.label}
                    onAction={noResultsAction?.onClick}
                  />
                ) : (
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyAction?.label}
                    onAction={emptyAction?.onClick}
                  />
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => {
              const id = rowId(row, index);
              const selected = selectedIds.includes(id);
              const visibleActions = rowActions?.filter((a) => !a.hidden?.(row)) ?? [];
              return (
                <TableRow
                  key={id}
                  data-state={selected ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {selectable && (
                    <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`${col.className ?? ""} ${col.align ? alignClass[col.align] : ""} ${
                        col.hideBelow ? hideBelowClass[col.hideBelow] : ""
                      }`}
                    >
                      {col.cell ? col.cell(row, index) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      {visibleActions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 rounded-md text-app-fg-muted hover:text-app-accent hover:bg-app-accent-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {visibleActions.map((action) => (
                              <DropdownMenuItem
                                key={action.label}
                                onSelect={() => action.onClick(row)}
                                className={`gap-2 cursor-pointer ${
                                  action.variant === "danger"
                                    ? "text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10"
                                    : ""
                                }`}
                              >
                                {action.icon && <action.icon size={15} />}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && !isLoading && !isError && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
}

/* ── Dark-aware pagination footer (the shared Pagination is light-only) ───── */
function TablePagination({ currentPage, totalPages, totalItems, onPageChange }: PaginationState) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 border-t border-app-border">
      <span className="text-[13px] text-app-fg-muted">
        {typeof totalItems === "number"
          ? `${totalItems.toLocaleString("en-IN")} total`
          : `Page ${currentPage} of ${totalPages}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-app-border text-[13px] font-medium text-app-fg hover:bg-app-surface-2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <span className="text-[13px] font-semibold text-app-fg px-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-app-border text-[13px] font-medium text-app-fg hover:bg-app-surface-2 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default AdminDataTable;
