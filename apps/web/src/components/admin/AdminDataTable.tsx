import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Inbox,
  Loader2,
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
import {
  BTN_PRIMARY,
  FOCUS_RING,
  MENU_ITEM,
  MENU_ITEM_DANGER,
  PORTAL_VARS,
  SKELETON,
} from "./adminUI";

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
  /** Greys the item out and swallows the click. */
  disabled?: (row: T) => boolean;
  /** This action is in flight for this row: shows a spinner and blocks re-clicks. */
  loading?: (row: T) => boolean;
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
  /** Rows per page, used only to render the "showing X–Y" range. */
  pageSize?: number;
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
  /**
   * Row has a mutation in flight: dims it and swaps the actions trigger for a
   * spinner, so a slow approve/delete reads as "working" rather than "ignored".
   */
  rowBusy?: (row: T) => boolean;

  pagination?: PaginationState;
  sortState?: SortState;
  onSortChange?: (sort: SortState) => void;

  getRowId?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
  className?: string;

  /**
   * Pins the header row while the body scrolls.
   *
   * Only has an effect together with `maxBodyHeight`. The table already sits in
   * an `overflow-auto` wrapper (needed so wide tables scroll sideways on
   * mobile), and a sticky `thead` sticks to its nearest scrolling ancestor —
   * which is that wrapper, not the page. With no height cap the wrapper never
   * scrolls vertically, so the header has nothing to stick against.
   */
  stickyHeader?: boolean;
  /** CSS height cap for the scroll area, e.g. "60vh" or "480px". */
  maxBodyHeight?: string;

  /**
   * Row-level keyboard navigation: `j`/`k` and ↑/↓ to move, Enter to open, `x`
   * to select, Escape to clear the selection. Rows carry a roving tabIndex, so
   * Tab reaches the list once and the arrow keys take over from there.
   */
  enableKeyboardNav?: boolean;
}

/** Keys must never fire while the operator is typing into something. */
function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node || !node.tagName) return false;
  const tag = node.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    node.isContentEditable === true
  );
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

/* Skeleton cells vary in width per column so a loading table has the silhouette
   of real data. A grid of identical bars reads as a broken layout. */
const SKELETON_WIDTHS = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-24", "w-20"];

/**
 * Generic admin data table. Renders sortable headers, optional row selection +
 * per-row action menu, and owns the loading-skeleton / empty / no-results /
 * error states so every management page presents them identically.
 *
 * Sorting and pagination are controlled: provide `sortState`/`onSortChange` and
 * `pagination` and the parent decides whether to sort/page client- or
 * server-side. Omit them for a plain table over pre-sliced `data`.
 *
 * Visual conventions (header case, row height, hover and selected washes) live
 * in the `[data-brand="admin"]` table rules in admin.css rather than here, so
 * the same JSX renders correctly in the vendor console too.
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
  rowBusy,
  pagination,
  sortState,
  onSortChange,
  getRowId,
  onRowClick,
  skeletonRows = 8,
  className = "",
  stickyHeader = true,
  maxBodyHeight,
  enableKeyboardNav = true,
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
    onSelectionChange(
      allSelected
        ? selectedIds.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...selectedIds, ...pageIds])),
    );
  };
  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  };

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    if (sortState?.sortBy === key) {
      onSortChange({ sortBy: key, sortDir: sortState.sortDir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ sortBy: key, sortDir: "asc" });
    }
  };

  /* ── Keyboard navigation ────────────────────────────────────────────────
     One row at a time is tabbable (roving tabIndex), so Tab moves *to* the
     list rather than through every row in it, and j/k walk it from there.
     The index is remembered across pagination so returning to a page puts
     the cursor back where it was rather than at the top. */
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const navigable = enableKeyboardNav && !isLoading && !isError && data.length > 0;

  // Clamp when the page shrinks — a stale index would leave no tabbable row.
  useEffect(() => {
    setFocusedIndex((i) => (data.length ? Math.min(i, data.length - 1) : 0));
  }, [data.length]);

  const focusRow = useCallback(
    (index: number, total: number) => {
      if (!total) return;
      const clamped = Math.max(0, Math.min(index, total - 1));
      setFocusedIndex(clamped);
      const el = containerRef.current?.querySelector<HTMLTableRowElement>(
        `tr[data-row-index="${clamped}"]`,
      );
      el?.focus();
      // `nearest` keeps a mid-list row still instead of yanking it to centre.
      el?.scrollIntoView({ block: "nearest" });
    },
    [],
  );

  /**
   * `j` / `k` with nothing focused enter the table at the remembered row. Arrow
   * keys are deliberately NOT bound here — at document level they are the
   * page's scroll, and stealing them would break the one thing every user
   * expects. Inside the table (where the handler below runs) they work.
   */
  useEffect(() => {
    if (!navigable) return;
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "j" && e.key !== "k") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const active = document.activeElement;
      // Something else owns focus — including another table on the same page,
      // whose handler will have called preventDefault before this one runs.
      if (active && active !== document.body && active !== document.documentElement) return;
      e.preventDefault();
      focusRow(focusedIndex, data.length);
    };
    document.addEventListener("keydown", onDocKeyDown);
    return () => document.removeEventListener("keydown", onDocKeyDown);
  }, [navigable, focusedIndex, data.length, focusRow]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!navigable || isTypingTarget(e.target)) return;
    const onRow = (e.target as HTMLElement)?.tagName === "TR";

    switch (e.key) {
      case "j":
      case "ArrowDown":
        e.preventDefault();
        focusRow(onRow ? focusedIndex + 1 : focusedIndex, data.length);
        break;
      case "k":
      case "ArrowUp":
        e.preventDefault();
        focusRow(onRow ? focusedIndex - 1 : focusedIndex, data.length);
        break;
      case "Home":
        if (!onRow) return;
        e.preventDefault();
        focusRow(0, data.length);
        break;
      case "End":
        if (!onRow) return;
        e.preventDefault();
        focusRow(data.length - 1, data.length);
        break;
      case "Enter": {
        // Only from the row itself: Enter on the row-actions trigger belongs to
        // the menu, and on a link belongs to the link.
        if (!onRow || !onRowClick) return;
        const row = data[focusedIndex];
        if (!row || rowBusy?.(row)) return;
        e.preventDefault();
        onRowClick(row);
        break;
      }
      case "x": {
        if (!onRow || !selectable || !onSelectionChange) return;
        const row = data[focusedIndex];
        if (!row) return;
        e.preventDefault();
        toggleRow(rowId(row, focusedIndex));
        break;
      }
      case "Escape": {
        // Only meaningful when there is a selection to drop; otherwise Escape
        // belongs to whatever layer is above (a drawer, a menu).
        if (!selectedIds.length || !onSelectionChange) return;
        e.preventDefault();
        onSelectionChange([]);
        break;
      }
      default:
        break;
    }
  };

  return (
    /* maxBodyHeight is a runtime string, so it can't be a Tailwind arbitrary
       value (those are extracted at build time). It rides in as a CSS custom
       property that a static class then reads. */
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
      style={
        maxBodyHeight
          ? ({ "--admin-table-max-h": maxBodyHeight } as React.CSSProperties)
          : undefined
      }
    >
      <Table
        className={stickyHeader && maxBodyHeight ? "admin-table-sticky" : undefined}
        containerClassName={
          maxBodyHeight ? "overflow-y-auto max-h-[var(--admin-table-max-h)]" : undefined
        }
      >
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
                  aria-sort={
                    isSorted
                      ? sortState!.sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : sortable
                        ? "none"
                        : undefined
                  }
                  className={`${col.className ?? ""} ${col.align ? alignClass[col.align] : ""} ${
                    col.hideBelow ? hideBelowClass[col.hideBelow] : ""
                  }`}
                >
                  {sortable ? (
                    /* The chevron holds its slot at 40% opacity when unsorted,
                       so headers don't reflow by a few pixels on every sort. */
                    <button
                      onClick={() => handleSort(col.key)}
                      className={`group/sort -mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 uppercase tracking-[0.04em] hover:bg-app-accent-soft hover:text-app-accent transition-colors ${FOCUS_RING}`}
                      aria-label={`Sort by ${col.header}`}
                    >
                      {col.header}
                      <span className="grid place-items-center w-3.5 shrink-0">
                        {isSorted ? (
                          sortState!.sortDir === "asc" ? (
                            <ArrowUp size={12} strokeWidth={2.6} className="text-app-accent" />
                          ) : (
                            <ArrowDown size={12} strokeWidth={2.6} className="text-app-accent" />
                          )
                        ) : (
                          <ChevronsUpDown
                            size={12}
                            strokeWidth={2.2}
                            className="opacity-40 group-hover/sort:opacity-90 transition-opacity"
                          />
                        )}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
            {hasActions && (
              <TableHead className="w-16 text-right pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                {Array.from({ length: totalCols }).map((__, j) => (
                  <TableCell key={j}>
                    <div
                      className={`h-3.5 ${SKELETON} ${
                        j === 0 && selectable
                          ? "w-4"
                          : j === totalCols - 1 && hasActions
                            ? "w-6 ml-auto"
                            : SKELETON_WIDTHS[j % SKELETON_WIDTHS.length]
                      }`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={totalCols} className="py-14">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 grid place-items-center">
                    <AlertCircle size={22} className="text-red-500" />
                  </div>
                  <p className="text-[13px] text-app-fg-muted max-w-sm">{errorMessage}</p>
                  {onRetry && (
                    <button onClick={onRetry} className={BTN_PRIMARY}>
                      Try again
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
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
              const busy = rowBusy?.(row) ?? false;
              return (
                <TableRow
                  key={id}
                  data-row-index={index}
                  data-state={selected ? "selected" : undefined}
                  aria-busy={busy || undefined}
                  aria-selected={selectable ? selected : undefined}
                  /* Roving tabIndex: exactly one row is in the tab order, so
                     Tab reaches the list and j/k walk it. */
                  tabIndex={navigable ? (index === focusedIndex ? 0 : -1) : undefined}
                  onFocus={() => setFocusedIndex(index)}
                  onClick={
                    onRowClick && !busy
                      ? (e) => {
                          // Focus the row before opening so the drawer's focus
                          // trap has somewhere to return focus to on close.
                          e.currentTarget.focus();
                          onRowClick(row);
                        }
                      : undefined
                  }
                  className={`group/row ${onRowClick && !busy ? "cursor-pointer" : ""} ${
                    busy ? "opacity-60 transition-opacity" : ""
                  }`}
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
                      {col.cell
                        ? col.cell(row, index)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      {visibleActions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            {/* Fades up on row hover so a long table isn't a
                                column of dots, but stays fully visible on
                                touch and for keyboard focus. */}
                            <button
                              className={`grid place-items-center w-8 h-8 rounded-lg text-app-fg-subtle
                                opacity-60 group-hover/row:opacity-100 focus-visible:opacity-100
                                data-[state=open]:opacity-100 data-[state=open]:bg-app-accent-soft
                                data-[state=open]:text-app-accent
                                hover:bg-app-accent-soft hover:text-app-accent
                                transition-[opacity,background-color,color] duration-150
                                disabled:pointer-events-none ${FOCUS_RING}`}
                              aria-label={busy ? "Updating row" : "Row actions"}
                              disabled={busy}
                            >
                              {busy ? (
                                <Loader2 size={16} className="animate-spin text-app-accent" />
                              ) : (
                                <MoreHorizontal size={16} />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            style={PORTAL_VARS}
                            className="w-48 p-1.5 rounded-xl border-app-border bg-app-surface shadow-[0_2px_4px_rgba(18,25,38,0.04),0_16px_32px_-12px_rgba(18,25,38,0.18)]"
                          >
                            {visibleActions.map((action) => {
                              const actionLoading = action.loading?.(row) ?? false;
                              const actionDisabled =
                                actionLoading || busy || (action.disabled?.(row) ?? false);
                              return (
                                <DropdownMenuItem
                                  key={action.label}
                                  disabled={actionDisabled}
                                  onSelect={(e) => {
                                    // Radix still fires onSelect for a disabled
                                    // item reached by keyboard — guard both ways.
                                    if (actionDisabled) {
                                      e.preventDefault();
                                      return;
                                    }
                                    action.onClick(row);
                                  }}
                                  className={`${
                                    action.variant === "danger" ? MENU_ITEM_DANGER : MENU_ITEM
                                  } ${actionDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                >
                                  {actionLoading ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    action.icon && (
                                      <action.icon size={15} className="shrink-0 opacity-70" />
                                    )
                                  )}
                                  {action.label}
                                </DropdownMenuItem>
                              );
                            })}
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

/* ── Pagination ───────────────────────────────────────────────────────────
   Numbered pages rather than prev/next alone: on a 40-page table, "Next" is
   the only way forward and jumping to the end takes 39 clicks. */

/** Page numbers around the current one, with `null` marking an ellipsis gap. */
function pageWindow(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | null> = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);

  if (from > 2) pages.push(null);
  for (let p = from; p <= to; p++) pages.push(p);
  if (to < total - 1) pages.push(null);
  pages.push(total);

  return pages;
}

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize,
}: PaginationState) {
  const pages = pageWindow(currentPage, totalPages);

  const arrow =
    "grid place-items-center w-9 h-9 rounded-lg border border-app-border text-app-fg-muted " +
    "hover:bg-app-surface-2 hover:text-app-fg disabled:opacity-40 disabled:pointer-events-none " +
    `transition-colors ${FOCUS_RING}`;

  // Range readout — more useful than a bare page number when scanning a list.
  let range: string | null = null;
  if (typeof totalItems === "number" && pageSize) {
    const first = (currentPage - 1) * pageSize + 1;
    const last = Math.min(currentPage * pageSize, totalItems);
    range = `${first.toLocaleString("en-IN")}–${last.toLocaleString("en-IN")} of ${totalItems.toLocaleString("en-IN")}`;
  } else if (typeof totalItems === "number") {
    range = `${totalItems.toLocaleString("en-IN")} total`;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-t border-app-border"
    >
      <p className="text-[12.5px] text-app-fg-muted tabular-nums">
        {range ?? `Page ${currentPage} of ${totalPages}`}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={arrow}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbers collapse below sm — at that width they wrap into a second
            row and push the arrows off the edge. */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, i) =>
            page === null ? (
              <span
                key={`gap-${i}`}
                aria-hidden
                className="grid place-items-center w-9 h-9 text-app-fg-subtle text-[13px]"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`grid place-items-center min-w-[36px] h-9 px-2 rounded-lg text-[13px] font-semibold tabular-nums transition-colors ${FOCUS_RING} ${
                  page === currentPage
                    ? "bg-app-accent text-app-accent-fg"
                    : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <span className="sm:hidden px-2 text-[12.5px] font-semibold text-app-fg tabular-nums">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={arrow}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

export default AdminDataTable;
