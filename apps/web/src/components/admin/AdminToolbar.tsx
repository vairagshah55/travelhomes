import React, { useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { COUNT_BUBBLE, FOCUS_RING, PORTAL_VARS, SELECT_ITEM } from "./adminUI";

export interface ToolbarBulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface AdminToolbarProps {
  // Search
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;

  // Sort
  sortOptions?: Array<{ value: string; label: string }>;
  sortValue?: string;
  onSortChange?: (v: string) => void;

  // Filter trigger
  onFilterOpen?: () => void;
  filterActiveCount?: number;

  // Bulk actions — shown only when selectedCount > 0
  selectedCount?: number;
  bulkActions?: ToolbarBulkAction[];
  onClearSelection?: () => void;

  // Right-side primary action — e.g. "Add User"
  primaryAction?: React.ReactNode;

  /**
   * Filter control rendered inline with search and sort — normally an
   * `<AdminFilterBar/>`. It lives here rather than as a sibling below so the
   * whole query-building row reads as one group; rendered separately, the
   * Filters button ended up on its own line, detached from the search it
   * narrows.
   */
  filterSlot?: React.ReactNode;

  /** Right-aligned trailing content — typically a secondary control. */
  trailing?: React.ReactNode;

  /**
   * Rows the current query matched. Rendered next to the controls as
   * "248 bookings" so the active view is readable without counting rows or
   * reading the pagination footer — the filters say what was asked for, this
   * says what came back.
   */
  resultCount?: number;
  /** Singular noun for the count, pluralised with a trailing "s". */
  resultNoun?: string;

  /**
   * `/` anywhere on the page focuses this search box (the convention in every
   * console-shaped tool). Turn it off for a second toolbar on the same route —
   * two fields racing for one key is worse than none.
   */
  searchHotkey?: boolean;

  className?: string;
}

/** Shared silhouette for the toolbar's non-search controls. */
const CONTROL =
  "h-9 rounded-lg border border-app-border bg-app-surface text-[13px] font-medium text-app-fg " +
  "hover:border-app-fg-subtle/40 hover:bg-app-surface-2 " +
  "transition-[background-color,border-color,box-shadow] duration-150 " +
  FOCUS_RING;

/**
 * Standard management-page toolbar: search + sort + filter trigger on the left,
 * a primary action on the right, and a bulk-action bar that slides in when rows
 * are selected. Replaces the ad-hoc search/sort/filter rows that used to be
 * duplicated across the management pages.
 *
 * The bulk bar REPLACES the controls row rather than stacking above it. Both at
 * once pushed the table down by ~56px on every selection, so the row you just
 * clicked moved out from under the cursor.
 */
export function AdminToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  sortOptions,
  sortValue,
  onSortChange,
  onFilterOpen,
  filterActiveCount = 0,
  selectedCount = 0,
  bulkActions,
  onClearSelection,
  primaryAction,
  filterSlot,
  trailing,
  resultCount,
  resultNoun = "result",
  searchHotkey = true,
  className = "",
}: AdminToolbarProps) {
  const hasSelection = selectedCount > 0 && !!bulkActions?.length;
  const searchRef = useRef<HTMLInputElement>(null);

  /* `/` jumps to search from anywhere on the page — but not while the operator
     is already typing somewhere, and not when a dialog or drawer is open over
     the list (Radix marks the rest of the page aria-hidden / inert while a
     modal layer holds focus, so stealing focus back would fight the trap). */
  useEffect(() => {
    if (!searchHotkey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || el?.isContentEditable) return;
      const input = searchRef.current;
      if (!input || input.closest("[aria-hidden='true']") || input.closest("[inert]")) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [searchHotkey]);

  /** Escape clears a term, or steps out of the field when it is already empty. */
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    if (searchValue) onSearchChange("");
    else e.currentTarget.blur();
  };

  const countLabel =
    typeof resultCount === "number"
      ? `${resultCount.toLocaleString("en-IN")} ${resultNoun}${resultCount === 1 ? "" : "s"}`
      : null;

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {hasSelection ? (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-app-accent/25 bg-app-accent-soft px-2.5 py-1.5 min-h-[40px]"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-app-accent">
              <span className={`${COUNT_BUBBLE} bg-app-accent text-app-accent-fg`} aria-hidden>
                {selectedCount}
              </span>
              selected
            </span>

            <div aria-hidden className="w-px h-5 bg-app-accent/20 mx-1" />

            <div className="flex flex-wrap items-center gap-1">
              {bulkActions!.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-[13px] font-semibold transition-colors ${FOCUS_RING} ${
                    action.variant === "danger"
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      : "text-app-accent hover:bg-app-accent/[0.12]"
                  }`}
                >
                  {action.icon && <action.icon size={15} />}
                  {action.label}
                </button>
              ))}
            </div>

            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 h-8 text-[12.5px] font-medium text-app-fg-muted hover:text-app-fg hover:bg-app-surface/60 transition-colors ${FOCUS_RING}`}
                aria-label="Clear selection"
              >
                <X size={14} /> Clear
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-between gap-2 min-h-[40px]"
          >
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {/* Search — a plain input rather than the shadcn one, because the
                  admin.css `input[type="search"]` pill rule would otherwise
                  fight this component's own geometry. Grows to fill the row so
                  the toolbar reads as one bar, not three floating widgets. */}
              <div className="relative flex-1 min-w-[180px] sm:max-w-sm">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-fg-subtle"
                  aria-hidden
                />
                <input
                  ref={searchRef}
                  type="text"
                  role="searchbox"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className={`h-9 w-full pl-9 pr-8 rounded-lg border border-app-border bg-app-surface
                    text-[13px] text-app-fg placeholder:text-app-fg-subtle
                    focus:border-app-accent focus:ring-[3px] focus:ring-app-accent/18
                    focus:outline-none transition-[border-color,box-shadow] duration-150`}
                  aria-label={searchPlaceholder}
                />
                {/* Explicit clear: `type="search"` renders a native ✕ in
                    WebKit but nothing in Firefox, so the affordance was
                    inconsistent across browsers. */}
                {searchValue ? (
                  <button
                    onClick={() => onSearchChange("")}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded text-app-fg-subtle hover:text-app-fg hover:bg-app-surface-2 transition-colors ${FOCUS_RING}`}
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  searchHotkey && (
                    /* The shortcut has to be discoverable to be worth having.
                       Hidden on touch widths, where there is no key to press. */
                    <kbd
                      aria-hidden
                      className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 sm:grid place-items-center h-5 min-w-[20px] px-1.5 rounded border border-app-border bg-app-surface-2 text-[10.5px] font-semibold text-app-fg-subtle"
                    >
                      /
                    </kbd>
                  )
                )}
              </div>

              {/* Sort */}
              {sortOptions?.length && onSortChange ? (
                <Select value={sortValue} onValueChange={onSortChange}>
                  <SelectTrigger className={`${CONTROL} w-[150px] px-3`}>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  {/* Radix portals this to <body>, outside the admin root, so it
                      needs its own token vars; SELECT_ITEM works around the
                      duplicated `--accent` that renders highlighted rows
                      white-on-white. See adminUI.ts. */}
                  <SelectContent style={PORTAL_VARS} className="rounded-xl border-app-border">
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className={SELECT_ITEM}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {/* Filter trigger */}
              {onFilterOpen && (
                <button
                  onClick={onFilterOpen}
                  className={`${CONTROL} relative inline-flex items-center gap-2 px-3.5 ${
                    filterActiveCount > 0 ? "border-app-accent/40 text-app-accent" : ""
                  }`}
                  aria-label={
                    filterActiveCount > 0 ? `Filters, ${filterActiveCount} active` : "Filters"
                  }
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {filterActiveCount > 0 && (
                    <span className={`${COUNT_BUBBLE} bg-app-accent text-app-accent-fg`}>
                      {filterActiveCount}
                    </span>
                  )}
                </button>
              )}

              {filterSlot}
            </div>

            {(countLabel || trailing || primaryAction) && (
              <div className="flex items-center gap-3 shrink-0">
                {countLabel && (
                  <span
                    aria-live="polite"
                    className="text-[12.5px] font-medium text-app-fg-muted tabular-nums whitespace-nowrap"
                  >
                    {countLabel}
                  </span>
                )}
                {trailing}
                {primaryAction}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminToolbar;
